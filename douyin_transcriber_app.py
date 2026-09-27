"""抖音链接 -> 视频 -> 音频 -> Whisper/ASR -> TXT/SRT 文字稿

运行前：
  pip install -r requirements-transcriber.txt
  export ASR_API_KEY="你的 ASR API Key"
  python douyin_transcriber_app.py

默认请求 OpenAI-compatible 的 /v1/audio/transcriptions 接口。
也可以通过 ASR_API_URL 指定其他兼容 Whisper 的服务地址。
"""

from __future__ import annotations

import json
import mimetypes
import os
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import gradio as gr
import requests

TMP_ROOT = Path(os.getenv("TRANSCRIBER_TMP_DIR", ".voiceink_tmp"))
OUTPUT_DIR = Path(os.getenv("TRANSCRIBER_OUTPUT_DIR", "outputs"))
MAX_VIDEO_BYTES = int(os.getenv("MAX_VIDEO_BYTES", str(500 * 1024 * 1024)))
REQUEST_TIMEOUT = (20, 600)

HEADER = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 "
        "Mobile/15E148 Safari/604.1"
    )
}


def extract_first_url(text: str) -> str | None:
    """从复制的分享文案中提取第一个 URL。"""
    match = re.search(r"https?://[^\s\"<>]+", text or "")
    return match.group(0).rstrip(".,，。") if match else None


def validate_douyin_url(url: str) -> None:
    host = (urlparse(url).hostname or "").lower()
    allowed = {"v.douyin.com", "douyin.com", "www.douyin.com", "iesdouyin.com", "www.iesdouyin.com"}
    if host not in allowed and not host.endswith(".douyin.com"):
        raise ValueError("只支持抖音分享链接，例如 https://v.douyin.com/xxxx")


def get_video_url(share_url: str) -> tuple[str, str]:
    """解析抖音分享页，返回视频播放地址和视频 ID。"""
    validate_douyin_url(share_url)
    response = requests.get(share_url, headers=HEADER, timeout=REQUEST_TIMEOUT, allow_redirects=True)
    response.raise_for_status()

    path_parts = [part for part in response.url.split("?")[0].strip("/").split("/") if part]
    video_id = path_parts[-1] if path_parts else "douyin_video"
    detail_url = f"https://www.iesdouyin.com/share/video/{video_id}"
    detail = requests.get(detail_url, headers=HEADER, timeout=REQUEST_TIMEOUT)
    detail.raise_for_status()

    pattern = re.compile(r"window\._ROUTER_DATA\s*=\s*(.*?)</script>", re.DOTALL)
    match = pattern.search(detail.text)
    if not match:
        raise ValueError("无法从抖音页面解析视频信息，可能是页面结构已变化")

    raw_json = match.group(1).strip().rstrip(";")
    data: dict[str, Any] = json.loads(raw_json)
    item = data["loaderData"]["video_(id)/page"]["videoInfoRes"]["item_list"][0]
    # 这里只需要视频中的音频内容，不做去水印或画面处理。
    video_url = item["video"]["play_addr"]["url_list"][0]
    return video_url, video_id


def download_video(video_url: str, save_path: Path) -> Path:
    response = requests.get(video_url, headers=HEADER, stream=True, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    total = 0
    with save_path.open("wb") as output:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if not chunk:
                continue
            total += len(chunk)
            if total > MAX_VIDEO_BYTES:
                raise ValueError(f"视频超过大小限制（{MAX_VIDEO_BYTES // 1024 // 1024} MB）")
            output.write(chunk)
    return save_path


def extract_audio(video_path: Path, audio_path: Path) -> Path:
    """用 ffmpeg 将视频转为 16 kHz 单声道 WAV，适合 Whisper/ASR。"""
    command = [
        "ffmpeg", "-y", "-i", str(video_path), "-vn", "-ac", "1", "-ar", "16000",
        "-c:a", "pcm_s16le", str(audio_path),
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"音频提取失败：{result.stderr[-800:]}")
    return audio_path


def asr_endpoint() -> str:
    configured = os.getenv("ASR_API_URL")
    if configured:
        return configured.rstrip("/")
    forge_url = os.getenv("BUILT_IN_FORGE_API_URL")
    if forge_url:
        return f"{forge_url.rstrip('/')}/v1/audio/transcriptions"
    return "https://api.openai.com/v1/audio/transcriptions"


def transcribe_audio(audio_path: Path, language: str = "") -> dict[str, Any]:
    """调用 OpenAI-compatible Whisper verbose_json 接口。"""
    api_key = os.getenv("ASR_API_KEY") or os.getenv("BUILT_IN_FORGE_API_KEY")
    if not api_key:
        raise RuntimeError("未配置 ASR_API_KEY（或 BUILT_IN_FORGE_API_KEY）")

    model = os.getenv("ASR_MODEL", "whisper-1")
    data = {"model": model, "response_format": "verbose_json"}
    if language and language != "自动识别":
        data["language"] = language

    mime_type = mimetypes.guess_type(audio_path.name)[0] or "audio/wav"
    with audio_path.open("rb") as audio_file:
        response = requests.post(
            asr_endpoint(),
            headers={"Authorization": f"Bearer {api_key}"},
            data=data,
            files={"file": (audio_path.name, audio_file, mime_type)},
            timeout=REQUEST_TIMEOUT,
        )
    if not response.ok:
        raise RuntimeError(f"ASR 请求失败：HTTP {response.status_code} {response.text[:500]}")
    result = response.json()
    if not result.get("text"):
        raise RuntimeError("ASR 返回结果中没有 text 字段")
    return result


def format_timestamp(seconds: float, comma: bool = True) -> str:
    millis = max(0, int(round(float(seconds) * 1000)))
    hours, remainder = divmod(millis, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    separator = "," if comma else "."
    return f"{hours:02d}:{minutes:02d}:{secs:02d}{separator}{millis:03d}"


def normalize_segments(result: dict[str, Any]) -> list[dict[str, Any]]:
    segments = result.get("segments") or []
    if segments:
        return segments
    return [{"start": 0, "end": result.get("duration", 0), "text": result["text"]}]


def write_transcripts(result: dict[str, Any], stem: str) -> tuple[Path, Path, str]:
    segments = normalize_segments(result)
    txt_lines = []
    srt_blocks = []
    for index, segment in enumerate(segments, start=1):
        text = str(segment.get("text", "")).strip()
        start = float(segment.get("start", 0))
        end = float(segment.get("end", start + 1))
        txt_lines.append(f"[{format_timestamp(start, comma=False)}] {text}")
        srt_blocks.append(
            f"{index}\n{format_timestamp(start)} --> {format_timestamp(end)}\n{text}\n"
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    txt_path = OUTPUT_DIR / f"{stem}.txt"
    srt_path = OUTPUT_DIR / f"{stem}.srt"
    txt_path.write_text("\n".join(txt_lines) + "\n", encoding="utf-8")
    srt_path.write_text("\n".join(srt_blocks), encoding="utf-8")
    return txt_path, srt_path, "\n".join(txt_lines)


def infer(share_info: str, language: str):
    """Gradio 主流程：抖音链接 -> 视频 -> 音频 -> ASR -> 文字稿。"""
    if not share_info or not share_info.strip():
        raise gr.Error("请先粘贴抖音分享链接")

    work_dir = Path(tempfile.mkdtemp(prefix="douyin_", dir=TMP_ROOT))
    try:
        share_url = extract_first_url(share_info)
        if not share_url:
            raise ValueError("没有找到有效 URL")

        video_url, video_id = get_video_url(share_url)
        video_path = download_video(video_url, work_dir / f"{video_id}.mp4")
        audio_path = extract_audio(video_path, work_dir / "audio.wav")
        result = transcribe_audio(audio_path, language)
        txt_path, srt_path, transcript = write_transcripts(result, video_id)
        video_output = OUTPUT_DIR / f"{video_id}.mp4"
        video_output.write_bytes(video_path.read_bytes())
        audio_output = OUTPUT_DIR / f"{video_id}.wav"
        audio_output.write_bytes(audio_path.read_bytes())

        status = (
            f"完成：{len(normalize_segments(result))} 个片段，"
            f"语言 {result.get('language', '未知')}，"
            f"时长 {float(result.get('duration', 0)):.1f} 秒"
        )
        return status, str(video_output), str(audio_output), transcript, [
            str(video_output), str(audio_output), str(txt_path), str(srt_path)
        ]
    except Exception as exc:
        raise gr.Error(f"处理失败：{exc}") from exc
    finally:
        # 只清理本次任务的临时目录，不影响其他用户任务。
        for path in work_dir.glob("*"):
            path.unlink(missing_ok=True)
        work_dir.rmdir()


def build_app() -> gr.Blocks:
    with gr.Blocks(title="抖音视频转文字") as demo:
        gr.Markdown(
            """# 抖音视频转文字\n\n"
            "抖音链接 → 获取视频 → 提取音频 → Whisper / ASR 转写 → 生成文字稿"""
        )
        with gr.Row():
            share_input = gr.Textbox(
                label="抖音分享链接或分享文案",
                placeholder="粘贴 https://v.douyin.com/... 或完整分享文案",
                lines=3,
            )
            language = gr.Dropdown(
                choices=["自动识别", "zh", "en", "ja", "ko"],
                value="自动识别",
                label="识别语言",
            )
        run_button = gr.Button("开始转写", variant="primary")
        status = gr.Textbox(label="状态", interactive=False)
        with gr.Row():
            video = gr.Video(label="获取的视频")
            audio = gr.Audio(label="提取的音频", type="filepath")
            transcript = gr.Textbox(label="文字稿（带时间戳）", lines=18)
        files = gr.Files(label="下载文字稿（TXT / SRT）")
        run_button.click(
            infer,
            inputs=[share_input, language],
            outputs=[status, video, audio, transcript, files],
        )
        gr.Markdown(
            "提示：请确保你有权下载和转写对应内容。ASR_API_URL 可指向任意兼容 Whisper 的接口。"
        )
    return demo


if __name__ == "__main__":
    TMP_ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    build_app().launch(
        server_name=os.getenv("GRADIO_SERVER_NAME", "127.0.0.1"),
        server_port=int(os.getenv("GRADIO_SERVER_PORT", "7860")),
        show_error=True,
    )

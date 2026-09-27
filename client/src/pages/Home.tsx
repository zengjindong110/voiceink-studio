import {
  AudioLines,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Download,
  FileAudio,
  FileText,
  FolderOpen,
  Headphones,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  ListFilter,
  Menu,
  Mic2,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings2,
  Sparkles,
  UploadCloud,
  UsersRound,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import { formatTranscript, type TranscriptSegment } from "@shared/transcript";
import { useEffect, useRef, useState } from "react";

const initialSegments: TranscriptSegment[] = [
  { id: 1, time: "00:00:04", start: 4, speaker: "SPEAKER 01", text: "大家好，欢迎回到这一期的创作者访谈。今天我们聊聊，如何把灵感真正变成作品。", confidence: 98, tone: "bg-cyan-400" },
  { id: 2, time: "00:00:16", start: 16, speaker: "SPEAKER 02", text: "很高兴来到这里。我觉得最重要的一点，是先建立一个能够持续创作的流程。", confidence: 96, tone: "bg-amber-300" },
  { id: 3, time: "00:00:28", start: 28, speaker: "SPEAKER 01", text: "这个流程里，记录和复盘占了很大一部分。你平时会怎么整理素材？", confidence: 97, tone: "bg-cyan-400" },
  { id: 4, time: "00:00:40", start: 40, speaker: "SPEAKER 02", text: "我会把每次对话先完整保存下来，再标记出真正值得二次加工的段落。", confidence: 94, tone: "bg-amber-300" },
  { id: 5, time: "00:00:52", start: 52, speaker: "SPEAKER 01", text: "所以一份好的文字稿，不只是记录，也是在帮你发现内容的结构。", confidence: 99, tone: "bg-cyan-400" },
];

const navItems = [
  { label: "工作台", icon: LayoutDashboard },
  { label: "我的项目", icon: FolderOpen, count: "12" },
  { label: "团队空间", icon: UsersRound },
];

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const [activeNav, setActiveNav] = useState("工作台");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [segments, setSegments] = useState(initialSegments);
  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("全部说话人");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!processing) return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(value + 14, 100);
        if (next === 100) {
          window.clearInterval(timer);
          window.setTimeout(() => setProcessing(false), 300);
        }
        return next;
      });
    }, 350);
    return () => window.clearInterval(timer);
  }, [processing]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const showNotice = (message: string) => setNotice(message);

  const handleFile = (file?: File) => {
    if (!file) return;
    setSelectedFile(file);
    setProgress(0);
    showNotice(`已添加 ${file.name}`);
  };

  const startTranscription = () => {
    if (!selectedFile) {
      uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      showNotice("请先选择一个视频或音频文件");
      return;
    }
    setProcessing(true);
    setProgress(8);
  };

  const downloadTranscript = (extension: "txt" | "srt" | "json") => {
    const content = formatTranscript(extension, "访谈节目 · 第 12 期", segments);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `voiceink-transcript.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice(`已导出 ${extension.toUpperCase()} 文件`);
  };

  const filteredSegments = segments.filter((segment) => {
    const matchesQuery = !query || `${segment.text} ${segment.speaker}`.toLowerCase().includes(query.toLowerCase());
    const matchesSpeaker = speaker === "全部说话人" || segment.speaker === speaker;
    return matchesQuery && matchesSpeaker;
  });

  const updateSegment = (id: number, text: string) => {
    setSegments((items) => items.map((item) => item.id === id ? { ...item, text } : item));
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#18312b] selection:bg-[#b7f16d] selection:text-[#18312b]">
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r border-[#dfe8e0] bg-[#102c25] px-5 py-6 text-white transition-transform duration-200 lg:static lg:translate-x-0 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#b7f16d] text-[#12372c] shadow-[0_0_24px_rgba(183,241,109,0.22)]">
                <AudioLines size={21} strokeWidth={2.6} />
              </div>
              <div>
                <div className="text-[17px] font-semibold tracking-[-0.03em]">voiceink</div>
                <div className="text-[9px] uppercase tracking-[0.26em] text-[#89a69a]">studio / beta</div>
              </div>
            </div>
            <button className="rounded-lg p-1 text-[#8ca89d] hover:bg-white/10 lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="关闭菜单"><X size={18} /></button>
          </div>

          <div className="mt-12 flex-1">
            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f8c80]">Workspace</div>
            <nav className="space-y-1">
              {navItems.map(({ label, icon: Icon, count }) => (
                <button key={label} onClick={() => { setActiveNav(label); setMobileNavOpen(false); if (label !== "工作台") showNotice(`${label}模块即将开放`); }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] transition ${activeNav === label ? "bg-[#21483c] text-[#d8ff9e]" : "text-[#a7beb3] hover:bg-white/[0.07] hover:text-white"}`}>
                  <Icon size={17} strokeWidth={1.9} />
                  <span className="flex-1">{label}</span>
                  {count && <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeNav === label ? "bg-[#385e4d] text-[#d8ff9e]" : "bg-white/10 text-[#8da99d]"}`}>{count}</span>}
                </button>
              ))}
            </nav>
            <div className="mb-3 mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f8c80]">Resources</div>
            <nav className="space-y-1">
              {[{ label: "素材库", icon: Inbox }, { label: "快捷指南", icon: BookOpen }].map(({ label, icon: Icon }) => (
                <button key={label} onClick={() => showNotice(`${label}模块即将开放`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] text-[#a7beb3] transition hover:bg-white/[0.07] hover:text-white"><Icon size={17} strokeWidth={1.9} /><span>{label}</span></button>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] text-[#cce5d6]"><Sparkles size={14} className="text-[#b7f16d]" /> 本月已用 6 / 20 小时</div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[30%] rounded-full bg-[#b7f16d]" /></div>
            <button onClick={() => showNotice("升级方案将在正式版开放")} className="text-[11px] font-semibold text-[#d8ff9e] hover:underline">升级方案 <span className="ml-1">→</span></button>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-white/10 px-2 pt-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1c8a2] text-[12px] font-bold text-[#6e3d29]">林</div>
            <div className="flex-1"><div className="text-[12px] font-medium">林小满</div><div className="text-[10px] text-[#77978b]">Creator plan</div></div>
            <button onClick={() => showNotice("账户设置即将开放")} className="text-[#86a297] hover:text-white" aria-label="账户设置"><Settings2 size={16} /></button>
          </div>
        </aside>

        {mobileNavOpen && <button aria-label="关闭菜单" className="fixed inset-0 z-30 bg-[#071a15]/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />}

        <main className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-[#e1e9e2] bg-[#f8faf8]/90 px-5 backdrop-blur-md sm:px-8 lg:px-10">
            <div className="flex items-center gap-3"><button onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 text-[#56736a] hover:bg-[#e8f0e9] lg:hidden" aria-label="打开菜单"><Menu size={20} /></button><span className="text-[12px] text-[#88a097]">Workspace</span><ChevronLeft size={14} className="rotate-180 text-[#b1c0b8]" /><span className="text-[12px] font-medium text-[#34584b]">{activeNav}</span></div>
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="relative hidden sm:block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba097]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文字稿..." className="h-9 w-[190px] rounded-xl border border-[#dce7df] bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-[#a8b8af] focus:border-[#91bf71] focus:ring-2 focus:ring-[#b7f16d]/30" /></div>
              <button onClick={() => showNotice("没有新的通知")} className="relative rounded-lg p-2 text-[#6e8b80] hover:bg-[#e8f0e9]" aria-label="通知"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#f3a15e]" /></button>
              <div className="hidden h-5 w-px bg-[#dfe8e0] sm:block" />
              <button onClick={() => showNotice("账户菜单即将开放")} className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1c8a2] text-[12px] font-bold text-[#6e3d29]">林</div><ChevronDown size={14} className="text-[#82978e]" /></button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 pb-14 pt-8 sm:px-8 lg:px-10">
            <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#83a194]"><span className="h-1.5 w-1.5 rounded-full bg-[#96d56e]" /> Creator workspace</div><h1 className="text-[32px] font-semibold tracking-[-0.05em] text-[#18312b] sm:text-[38px]">把声音，变成内容。</h1><p className="mt-2 text-[13px] leading-6 text-[#7b938a]">从视频到文字稿，保留每一个有价值的瞬间。</p></div>
              <button onClick={() => uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#183f33] px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(24,63,51,0.16)] transition hover:bg-[#245847] active:scale-[0.98]"><Plus size={16} /> 新建转写</button>
            </div>

            <section ref={uploadRef} className="relative overflow-hidden rounded-[22px] border border-[#dce8dc] bg-[#eaf4e7] p-5 sm:p-7">
              <div className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full bg-[#c8ef9b]/60 blur-2xl" /><div className="pointer-events-none absolute bottom-[-100px] left-[36%] h-56 w-56 rounded-full bg-[#d5f0dd]/90 blur-3xl" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center">
                <div className="flex-1"><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#739478]"><WandSparkles size={14} /> AI transcription</div><h2 className="text-[23px] font-semibold tracking-[-0.035em] text-[#1d4436]">上传一段内容，开始你的下一条作品</h2><p className="mt-2 max-w-[570px] text-[12px] leading-5 text-[#72917b]">支持 MP4、MOV、MP3、WAV 等格式。自动识别说话人，生成带时间戳的可编辑文字稿。</p><div className="mt-5 flex flex-wrap gap-2 text-[10px] text-[#73917b]"><span className="rounded-full border border-[#cfe3c9] bg-white/60 px-2.5 py-1">中文 / English</span><span className="rounded-full border border-[#cfe3c9] bg-white/60 px-2.5 py-1">说话人识别</span><span className="rounded-full border border-[#cfe3c9] bg-white/60 px-2.5 py-1">时间戳同步</span></div></div>
                <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files?.[0]); }} onClick={() => fileInputRef.current?.click()} className="group flex min-h-[156px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#9fc398] bg-white/55 px-5 text-center transition hover:border-[#6f9e6e] hover:bg-white/75 xl:max-w-[480px]">
                  <input ref={fileInputRef} type="file" accept="video/*,audio/*,.mp4,.mov,.mp3,.wav,.m4a,.webm" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d6f4bd] text-[#467548] transition group-hover:scale-105"><UploadCloud size={21} /></div>
                  {selectedFile ? <><div className="max-w-[280px] truncate text-[13px] font-semibold text-[#315e43]">{selectedFile.name}</div><div className="mt-1 text-[11px] text-[#76947c]">{formatBytes(selectedFile.size)} · 点击更换文件</div></> : <><div className="text-[13px] font-semibold text-[#315e43]">拖拽文件到这里，或点击上传</div><div className="mt-1 text-[11px] text-[#83a08a]">单个文件最大 2 GB</div></>}
                </div>
                <button onClick={startTranscription} disabled={processing} className="relative flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#a9e867] px-5 text-[12px] font-bold text-[#18312b] shadow-[0_8px_24px_rgba(113,167,77,0.2)] transition hover:bg-[#baf37a] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 xl:w-[142px]">{processing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#18312b]/25 border-t-[#18312b]" /> {progress}%</> : <><Mic2 size={16} /> 开始转写</>}</button>
              </div>
              {processing && <div className="relative mt-5"><div className="mb-2 flex justify-between text-[10px] text-[#668670]"><span>正在提取音频并识别语音...</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/70"><div className="h-full rounded-full bg-[#6d9f5b] transition-all duration-300" style={{ width: `${progress}%` }} /></div></div>}
            </section>

            <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
              <section className="min-w-0"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[#1b3a31]">最近项目</h2><p className="mt-1 text-[11px] text-[#91a59b]">你的文字稿会自动保存在这里</p></div><div className="flex items-center gap-2"><button onClick={() => showNotice("排序已切换")} className="flex items-center gap-2 rounded-lg border border-[#dce7df] bg-white px-3 py-2 text-[11px] font-medium text-[#607d71] hover:border-[#b8cdbb]"><ListFilter size={14} /> 最近编辑 <ChevronDown size={13} /></button><button onClick={() => showNotice("更多操作即将开放")} className="rounded-lg border border-[#dce7df] bg-white p-2 text-[#789187] hover:bg-[#f0f5f0]" aria-label="更多操作"><MoreHorizontal size={16} /></button></div></div>
                <div className="overflow-hidden rounded-2xl border border-[#e0e9e1] bg-white shadow-[0_10px_30px_rgba(28,67,48,0.035)]"><div className="grid grid-cols-[minmax(0,1fr)_110px_120px_34px] gap-4 border-b border-[#edf2ed] bg-[#fbfcfb] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aada2]"><span>项目名称</span><span>时长</span><span>状态</span><span /></div>
                  {[{ name: "访谈节目 · 第 12 期", type: "MP4 · 1080p", duration: "32:18", status: "已完成", icon: Video, color: "bg-[#e2f1de] text-[#5c9660]", time: "刚刚" }, { name: "品牌故事旁白初稿", type: "WAV · 48 kHz", duration: "08:42", status: "已完成", icon: FileAudio, color: "bg-[#fff0d8] text-[#b57a31]", time: "昨天" }, { name: "短视频选题会 09/24", type: "MOV · 4K", duration: "54:06", status: "处理中", icon: Video, color: "bg-[#e1eafd] text-[#627fb8]", time: "3 天前" }].map((project, index) => { const Icon = project.icon; return <button key={project.name} onClick={() => { setActiveId((index % segments.length) + 1); showNotice(`已打开「${project.name}」`); }} className="grid w-full grid-cols-[minmax(0,1fr)_110px_120px_34px] items-center gap-4 border-b border-[#edf2ed] px-5 py-4 text-left transition last:border-0 hover:bg-[#f7faf7]"><div className="flex min-w-0 items-center gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${project.color}`}><Icon size={16} /></div><div className="min-w-0"><div className="truncate text-[13px] font-semibold text-[#315349]">{project.name}</div><div className="mt-0.5 text-[10px] text-[#9aaca3]">{project.type} · {project.time}</div></div></div><span className="text-[12px] tabular-nums text-[#71897f]">{project.duration}</span><span className={`flex items-center gap-1.5 text-[11px] ${project.status === "处理中" ? "text-[#6b85b6]" : "text-[#6f9a74]"}`}><span className={`h-1.5 w-1.5 rounded-full ${project.status === "处理中" ? "bg-[#7d9fe0]" : "bg-[#7ebe72]"}`} />{project.status}</span><MoreHorizontal size={16} className="text-[#a9b8af]" /></button>; })}
                </div>
                <button onClick={() => showNotice("项目列表已全部加载")} className="mx-auto mt-5 flex items-center gap-2 text-[11px] font-medium text-[#76948a] hover:text-[#315e43]">查看全部项目 <ChevronDown size={14} /></button>
              </section>

              <aside className="space-y-5"><div className="rounded-2xl border border-[#e0e9e1] bg-white p-5"><div className="mb-4 flex items-center justify-between"><div><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aada2]">This week</div><div className="mt-1 text-[19px] font-semibold tracking-[-0.03em] text-[#26483c]">创作概览</div></div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf6e8] text-[#6c9b64]"><Clock3 size={17} /></div></div><div className="mb-5 flex items-end gap-2"><span className="text-[31px] font-semibold tracking-[-0.06em] text-[#1e4436]">4.6</span><span className="mb-1 text-[11px] text-[#94a79e]">小时已转写</span><span className="mb-1 ml-auto rounded-full bg-[#eef8e5] px-2 py-1 text-[10px] font-semibold text-[#6b9a61]">+18%</span></div><div className="flex h-16 items-end gap-1.5">{[34, 48, 28, 64, 43, 80, 56].map((height, index) => <div key={index} className="group flex flex-1 flex-col justify-end gap-1"><div className={`w-full rounded-t-md transition ${index === 5 ? "bg-[#aee86d]" : "bg-[#dcebd9] group-hover:bg-[#c5e4b9]"}`} style={{ height: `${height}%` }} /><span className="text-center text-[9px] text-[#a5b6ac]">{["一", "二", "三", "四", "五", "六", "日"][index]}</span></div>)}</div></div>
                <div className="rounded-2xl bg-[#183f33] p-5 text-white"><div className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-[#c9ee9e]"><Headphones size={15} /> 一分钟了解 VoiceInk</div><p className="text-[13px] font-medium leading-5 text-[#e4f0e8]">从录音到可发布的文字稿，只需要三步。</p><div className="mt-5 flex items-center gap-1.5"><span className="h-1.5 w-6 rounded-full bg-[#b7f16d]" /><span className="h-1.5 w-1.5 rounded-full bg-white/25" /><span className="h-1.5 w-1.5 rounded-full bg-white/25" /><span className="ml-auto text-[10px] text-[#95b4a6]">01 / 03</span></div><button onClick={() => showNotice("教程播放功能即将开放")} className="mt-5 flex items-center gap-2 text-[11px] font-semibold text-[#d8ff9e] hover:underline"><Play size={13} fill="currentColor" /> 开始观看</button></div></aside>
            </div>

            <section className="mt-12 border-t border-[#dde8df] pt-8"><div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86a297]">Live preview <span className="h-1.5 w-1.5 rounded-full bg-[#8ed36d]" /></div><h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[#1b3a31]">访谈节目 · 第 12 期</h2></div><div className="flex flex-wrap items-center gap-2"><button onClick={() => downloadTranscript("txt")} className="flex items-center gap-2 rounded-xl border border-[#dce7df] bg-white px-3 py-2 text-[11px] font-semibold text-[#56736a] hover:bg-[#f3f8f3]"><Download size={14} /> 导出 <ChevronDown size={12} /></button><button onClick={() => showNotice("分享链接已复制")} className="flex items-center gap-2 rounded-xl bg-[#183f33] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#245847]"><CheckCircle2 size={14} /> 已保存</button></div></div>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_230px]"><div className="overflow-hidden rounded-2xl border border-[#e0e9e1] bg-white shadow-[0_10px_30px_rgba(28,67,48,0.035)]"><div className="flex flex-wrap items-center gap-3 border-b border-[#edf2ed] px-5 py-3"><button onClick={() => setIsPlaying(!isPlaying)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#183f33] text-white transition hover:bg-[#285b48]" aria-label={isPlaying ? "暂停" : "播放"}>{isPlaying ? <span className="flex gap-0.5"><span className="h-3.5 w-0.5 bg-white" /><span className="h-3.5 w-0.5 bg-white" /></span> : <Play size={14} fill="currentColor" />}</button><span className="text-[11px] font-medium tabular-nums text-[#58756a]">{isPlaying ? "00:00:16" : "00:00:04"} <span className="text-[#b1c0b8]">/ 00:32:18</span></span><div className="h-1.5 min-w-[100px] flex-1 overflow-hidden rounded-full bg-[#e7efe7]"><div className={`h-full rounded-full bg-[#9bd56b] transition-all ${isPlaying ? "w-[16%]" : "w-[8%]"}`} /></div><button onClick={() => showNotice("音量控制已打开")} className="text-[#7c958a]" aria-label="音量"><AudioLines size={16} /></button><button onClick={() => showNotice("更多播放器选项即将开放")} className="text-[#7c958a]" aria-label="更多"><MoreHorizontal size={18} /></button></div><div className="flex items-center gap-2 border-b border-[#edf2ed] px-5 py-3"><div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1b2a8]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="在文字稿中搜索..." className="h-8 w-full rounded-lg bg-[#f4f8f4] pl-8 pr-3 text-[11px] outline-none placeholder:text-[#a2b1a9] focus:ring-2 focus:ring-[#b7f16d]/40" /></div><select value={speaker} onChange={(event) => setSpeaker(event.target.value)} className="h-8 rounded-lg border border-[#e2ebe3] bg-white px-2 text-[11px] text-[#6d887c] outline-none"><option>全部说话人</option><option>SPEAKER 01</option><option>SPEAKER 02</option></select><button onClick={() => showNotice("筛选功能已就绪")} className="rounded-lg border border-[#e2ebe3] p-2 text-[#789187] hover:bg-[#f4f8f4]" aria-label="筛选"><ListFilter size={14} /></button></div><div className="max-h-[420px] overflow-y-auto">{filteredSegments.map((segment) => <div key={segment.id} onClick={() => setActiveId(segment.id)} className={`group grid cursor-text grid-cols-[68px_minmax(0,1fr)] gap-3 border-b border-[#f0f4f0] px-5 py-4 transition last:border-0 sm:grid-cols-[76px_108px_minmax(0,1fr)_38px] ${activeId === segment.id ? "bg-[#f4faef]" : "hover:bg-[#fbfdfb]"}`}><button onClick={(event) => { event.stopPropagation(); setActiveId(segment.id); setIsPlaying(true); }} className="text-left text-[10px] font-medium tabular-nums text-[#8da39a] hover:text-[#557b63]">{segment.time}</button><div className="hidden items-start gap-2 pt-0.5 sm:flex"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${segment.tone}`} /><span className="text-[10px] font-semibold tracking-[0.06em] text-[#829b8e]">{segment.speaker}</span></div><div className="min-w-0"><textarea aria-label={`${segment.speaker}文字稿`} value={segment.text} onChange={(event) => updateSegment(segment.id, event.target.value)} onFocus={() => setActiveId(segment.id)} rows={2} className="w-full resize-none bg-transparent text-[13px] leading-6 text-[#36594d] outline-none" /><div className="mt-1 flex items-center gap-2 sm:hidden"><span className={`h-1.5 w-1.5 rounded-full ${segment.tone}`} /><span className="text-[9px] font-semibold tracking-[0.06em] text-[#829b8e]">{segment.speaker}</span></div></div><div className="hidden flex-col items-end gap-2 sm:flex"><span className="text-[9px] text-[#9aae9f]">{segment.confidence}%</span>{activeId === segment.id && <Check size={14} className="text-[#75ad5e]" />}</div></div>)}{filteredSegments.length === 0 && <div className="px-5 py-14 text-center text-[12px] text-[#91a69b]">没有找到匹配的段落</div>}</div><div className="flex items-center justify-between border-t border-[#edf2ed] bg-[#fbfcfb] px-5 py-3"><span className="text-[10px] text-[#9aada2]">{segments.length} 个段落 · 中文 · 自动保存</span><div className="flex items-center gap-3"><button onClick={() => downloadTranscript("srt")} className="text-[10px] font-medium text-[#739285] hover:text-[#315e43]">导出 SRT</button><button onClick={() => downloadTranscript("json")} className="text-[10px] font-medium text-[#739285] hover:text-[#315e43]">导出 JSON</button></div></div></div>
                <aside className="rounded-2xl border border-[#e0e9e1] bg-white p-5"><div className="mb-5 flex items-center justify-between"><h3 className="text-[13px] font-semibold text-[#315349]">文字稿信息</h3><button onClick={() => showNotice("项目设置即将开放")} className="text-[#93a89e] hover:text-[#315e43]" aria-label="设置"><Settings2 size={15} /></button></div><div className="space-y-4 text-[11px]"><div className="flex items-center justify-between"><span className="text-[#99aaa1]">识别语言</span><span className="font-medium text-[#56736a]">简体中文</span></div><div className="flex items-center justify-between"><span className="text-[#99aaa1]">说话人数</span><span className="font-medium text-[#56736a]">2 人</span></div><div className="flex items-center justify-between"><span className="text-[#99aaa1]">平均置信度</span><span className="font-medium text-[#6a9c66]">96.8%</span></div><div className="h-px bg-[#edf2ed]" /><div><div className="mb-2 text-[#99aaa1]">说话人</div><div className="space-y-2"><div className="flex items-center gap-2 text-[#56736a]"><span className="h-2 w-2 rounded-full bg-cyan-400" /> SPEAKER 01 <span className="ml-auto text-[10px] text-[#a8b8af]">3 段</span></div><div className="flex items-center gap-2 text-[#56736a]"><span className="h-2 w-2 rounded-full bg-amber-300" /> SPEAKER 02 <span className="ml-auto text-[10px] text-[#a8b8af]">2 段</span></div></div></div><div className="rounded-xl bg-[#f3f8f1] p-3 text-[10px] leading-5 text-[#789580]"><Sparkles size={14} className="mb-1 text-[#83b968]" />小提示：点击任意段落即可直接修改文字，修改会自动保存。</div></div></aside></div>
            </section>
          </div>
        </main>
      </div>
      {notice && <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#183f33] px-4 py-3 text-[12px] font-medium text-white shadow-[0_12px_30px_rgba(24,63,51,0.22)]"><CheckCircle2 size={15} className="text-[#b7f16d]" /> {notice}</div>}
    </div>
  );
}

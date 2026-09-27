"""Platform entrypoint for the Gradio app.

The implementation lives in douyin_transcriber_app.py; this small entrypoint
keeps the conventional app.py filename expected by Gradio hosting platforms.
"""

import os

import gradio as gr

from douyin_transcriber_app import OUTPUT_DIR, TMP_ROOT, build_app


if __name__ == "__main__":
    TMP_ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    demo: gr.Blocks = build_app()
    demo.launch(
        server_name=os.getenv("GRADIO_SERVER_NAME", "0.0.0.0"),
        server_port=int(os.getenv("GRADIO_SERVER_PORT", "7860")),
        show_error=True,
    )

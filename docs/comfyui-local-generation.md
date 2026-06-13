# ComfyUI 本地生成说明

本 PR 的素材样张必须通过 Windows 本地 ComfyUI 生成，不使用外部图片生成服务。

## 本机检查结果

- Comfy Desktop 已运行。
- ComfyUI API：`http://127.0.0.1:8188`
- 输出目录：`C:\Users\Administrator\ComfyUI-Shared\output`
- 共享模型目录：`C:\Users\Administrator\ComfyUI-Shared\models`
- 已检测到 checkpoint：`v1-5-pruned-emaonly-fp16.safetensors`

如果 ComfyUI 未检测到 checkpoint，需要先把 `.safetensors` 或 `.ckpt` 放到：

`C:\Users\Administrator\ComfyUI-Shared\models\checkpoints`

然后在 ComfyUI 刷新模型列表或重启 Comfy Desktop。

## 第一轮结果记录

已使用本地 ComfyUI 生成第一轮样张：

- checkpoint：`v1-5-pruned-emaonly-fp16.safetensors`
- 尺寸：`768 x 1024`
- 候选图：`assets/cards/samples/candidates/*.png`
- 推荐图：`assets/cards/samples/<card_id>.png`
- 预览拼图：`assets/cards/samples/preview-contact-sheet.png`

质量备注：

- 这批图是本地 ComfyUI 真实输出，可用于验证脚本、目录、命名、workflow 追溯链路。
- 当前 checkpoint 是 SD 1.5 基础模型，对国风历史卡牌、准确人物身份和卡背图案的表达较弱。
- 后续建议换用国风/写实卡牌向 checkpoint 或 SDXL/FLUX 本地模型，再复用同一批 prompt 和脚本重跑。

## 生成命令

先验证 ComfyUI 和 checkpoint：

```powershell
python scripts\comfyui_generate_card_samples.py --dry-run
```

生成 7 张推荐样张与 14 张候选图：

```powershell
python scripts\comfyui_generate_card_samples.py
```

指定 checkpoint：

```powershell
python scripts\comfyui_generate_card_samples.py --checkpoint "your_model.safetensors"
```

生成预览拼图：

```powershell
python scripts\comfyui_make_contact_sheet.py
```

## 输出约定

- 推荐样张：`assets/cards/samples/<card_id>.png`
- 候选图：`assets/cards/samples/candidates/<card_id>_<version>.png`
- 实际提交到 ComfyUI 的 workflow：`assets/cards/samples/workflows/<card_id>_<version>.json`
- 生成记录：`assets/cards/samples/generation-manifest.json`

首批卡牌：

- `liubang_002`
- `jixin_002`
- `xiangyu_002`
- `zhanghan_002`
- `xingyang_escape_004`
- `julu_battle_004`
- `card_back`

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-03-06

### Added

- 初始版本发布
- 文字生成模式
  - 支持文字 + 图片的多模态输入
  - 默认模型: `gemini-3.1-pro-preview`
  - 自动处理 Binary 图片数据（最多 3 张）
  - 支持文档附件自动提取
- 图像生成模式
  - Gemini-3.1-Flash-Image 模型（支持 13 种尺寸比例）
  - Gemini-3-Pro-Image 模型（支持 9 种尺寸比例，1K/2K/4K 分辨率）
  - 即梦 5.0 模型（支持 2K/3K 分辨率）
  - 支持文生图和图生图
- 视频生成模式（Sora 2）
  - 创建视频、混编视频、检索视频、下载视频、历史列表
  - 故事板模式支持分镜控制
  - 智能轮询等待机制
- 向量嵌入模式（Embeddings）
  - 支持 text-embedding-3-large 和 text-embedding-3-small
- 跨节点 Binary 读取功能
- API 端点: `https://api.maibao.chat/v1`

### Technical

- 基于 n8n-workflow 框架
- TypeScript 实现
- 完整的类型定义
- 自动 Base64 转换

[1.0.0]: https://github.com/maosonghuai/n8n-nodes-maibaoapi/releases/tag/v1.0.0

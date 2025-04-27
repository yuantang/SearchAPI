# 冥想内容智能搜索系统

基于语义理解的冥想课程搜索引擎，采用前后端分离架构，提供API接口和前端界面。

## 功能特点

- **语义搜索** - 基于同义词和相关概念的语义理解，找到更多相关内容
- **智能权重** - 标题匹配权重最高，其次是关键词，然后是描述
- **模糊匹配** - 支持模糊匹配和分词搜索，提高搜索结果的相关性
- **搜索建议** - 实时提供搜索建议，包括历史搜索和相关概念
- **搜索洞察** - 提供搜索结果的分类统计和相关概念分析
- **高亮显示** - 在搜索结果中高亮显示直接匹配和语义匹配的关键词
- **搜索历史** - 记录和显示用户的搜索历史，方便重复搜索
- **可配置选项** - 用户可以启用/禁用语义搜索、模糊匹配和高亮显示
- **结果评分** - 显示搜索结果的相关度评分和匹配类型
- **响应式设计** - 适应各种设备的屏幕尺寸

## 系统架构

- **前端**: HTML, CSS, JavaScript（纯客户端实现）
- **后端**: PHP RESTful API
- **数据**: JSON文件存储课程数据
- **开发模式**: 支持本地数据搜索，无需后端API

## 目录结构

```
meditation-search/
├── api/                  # API目录
│   ├── v1/               # API版本1
│   │   └── search.php    # 搜索API端点
│   ├── config.php        # API配置文件
│   ├── index.php         # API路由器
│   └── .htaccess         # API重写规则
├── index.html            # 前端主页
├── meditation-search.js  # 前端JavaScript
├── meditation-search.css # 前端样式
├── courses_data.json     # 课程数据
├── router.php            # 开发服务器路由器
├── server.php            # 开发服务器启动脚本（可选）
├── convert_csv_to_json.js # CSV转JSON工具（可选）
├── .htaccess             # 主重写规则
├── 课程相关信息.csv       # 原始课程数据（参考用）
└── README.md             # 项目说明
```

## 安装和运行

### 开发环境

#### 使用Python HTTP服务器（推荐）

1. 克隆或下载项目到本地
2. 确保`courses_data.json`文件存在于项目根目录
3. 运行以下命令启动HTTP服务器：

```bash
python -m http.server 8000
```

4. 访问 http://localhost:8000 查看应用

#### 使用PHP内置服务器

1. 克隆或下载项目到本地
2. 确保`courses_data.json`文件存在于项目根目录
3. 运行以下命令启动开发服务器：

```bash
php server.php
```

4. 访问 http://localhost:8000 查看应用

### 生产环境

#### 使用Apache/Nginx部署

1. 将项目文件复制到Web服务器的文档根目录
2. 确保启用了Apache的mod_rewrite模块或Nginx的相应重写配置
3. 修改`meditation-search.js`中的配置：
   - 将`USE_LOCAL_DATA`设置为`false`
   - 设置正确的`API_BASE_URL`指向您的API服务器
4. 访问您的网站域名查看应用

## API文档

### 搜索API

**端点**: `/api/v1/search`

**方法**: GET

**参数**:

- `q` (必需): 搜索查询
- `semantic` (可选): 是否启用语义搜索 (1=是, 0=否, 默认=0)
- `fuzzy` (可选): 是否启用模糊匹配 (1=是, 0=否, 默认=1)
- `limit` (可选): 每页结果数量 (默认=20)
- `offset` (可选): 结果偏移量 (默认=0)

**响应**:

```json
{
  "total": 42,
  "items": [
    {
      "id": 1,
      "title": "7天基础冥想",
      "keywords": "基础, 入门, 正念",
      "description": "...",
      "level": "初级",
      "duration": 70,
      "teacher": "Now团队",
      "category": "入门基础",
      "score": 8,
      "matchTypes": ["标题匹配"]
    },
    ...
  ],
  "query": "冥想",
  "semantic": true,
  "fuzzy": true,
  "limit": 20,
  "offset": 0,
  "expandedTerms": ["冥想", "打坐", "静坐", "禅修", ...]
}
```

## 本地数据搜索

在开发环境中，前端代码默认使用本地数据搜索功能，无需后端API。这是通过以下配置实现的：

```javascript
// 在meditation-search.js中
const USE_LOCAL_DATA = true; // 使用本地数据而不是API
```

本地搜索功能实现了与API相同的功能，包括：
- 基础搜索（标题、关键词、描述）
- 语义搜索（基于同义词和相关概念）
- 模糊匹配（分词和部分匹配）
- 分页功能

## 数据转换

如果需要更新课程数据，可以使用`convert_csv_to_json.js`脚本将CSV格式的课程数据转换为JSON格式：

```bash
node convert_csv_to_json.js
```

这将读取`课程相关信息.csv`文件，并生成`courses_data.json`文件。

## 许可证

MIT

# 行测成语辨析资料库（按组分页版）

这是适合扩展到 **1000 个成语 / 100 组左右** 的静态网站框架。

## 结构

```text
chengyu_group_paged_site/
├─ index.html                 # 首页：总目录
├─ group.html                 # 通用分组页：通过 ?id=g01 加载对应组
├─ assets/
│  ├─ style.css
│  ├─ home.js
│  └─ group.js
└─ data/
   ├─ catalog.js              # 总目录数据
   └─ groups/
      ├─ g01.js               # 第01组数据
      ├─ g02.js               # 第02组数据
      └─ g03.js               # 后续你自己新增
```

## 访问方式

首页：

```text
index.html
```

分组页：

```text
group.html?id=g01
group.html?id=g02
```

## 后续新增第03组

1. 复制 `data/groups/g02.js`，改名为 `g03.js`。
2. 修改里面的 `window.CHENGYU_GROUP_DATA` 内容。
3. 打开 `data/catalog.js`，把第03组的 `status` 从 `placeholder` 改成 `active`，并更新 `idiomCount`。
4. 上传到 GitHub：通常只需要上传/修改 `data/catalog.js` 和 `data/groups/g03.js`。

## 官媒语境填写方式

```js
officialContext: [
  {
    sentence: '这里填官媒/权威原句。',
    usage: '这里填用法说明：该词修饰什么对象，强调什么语义，适合什么题干信号。'
  },
  {
    sentence: '',
    usage: ''
  },
  {
    sentence: '',
    usage: ''
  }
]
```

空着也可以，页面会显示“待填写”。


## 本版目录 UI 调整

首页总目录已从大卡片改为紧凑长条列表，一行显示一组，包含：

- 组号
- 组名
- 主题说明
- 关键词
- 收录数量 / 待补充状态
- 进入按钮提示

这样 100 组目录会更省空间，首页一屏能看到更多分组。

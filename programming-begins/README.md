# index2.htmlの解説

## 各コードのページURL

index1.html: [https://hideyuki-ogawa.github.io/hannari-digital/programming-begins/index1.html](https://hideyuki-ogawa.github.io/hannari-digital/programming-begins/index1.html)
index2.html: [https://hideyuki-ogawa.github.io/hannari-digital/programming-begins/index2.html](https://hideyuki-ogawa.github.io/hannari-digital/programming-begins/index2.html)
index3.html: [https://hideyuki-ogawa.github.io/hannari-digital/programming-begins/index3.html](https://hideyuki-ogawa.github.io/hannari-digital/programming-begins/index3.html)


## HTML
HTML（HyperText Markup Language）は、ウェブページの構造を定義するための言語です。

#### 解説
- `<html>` タグはHTML文書の開始を示します。
- `<head>` タグには、ウェブページのメタ情報が含まれます。
- `<title>` タグは、ブラウザのタブに表示されるタイトルを指定します。
- `<style>` タグは、CSS（後述）を使ってページのスタイルを定義します。
- `<body>` タグには、ウェブページの内容が含まれます。
- `<h1>` タグは、一番大きな見出しを示します。
- `<h2>` タグは、二番目に大きな見出しを示します。
- `<p>` タグは、段落を示します。
- `<script>` タグは、JavaScript（後述）を含むために使います。

## CSS
CSS（Cascading Style Sheets）は、HTML要素の見た目を定義するための言語です。要素を指定して、見た目を整えられます。

```html
<style>
    body {
        background-color: white;
        color: black;
    }
</style>
```

### 解説
- `<style>` タグ内にCSSコードを記述します。
- `body` セレクタは、ページ全体の背景色と文字色を指定します。
  - `background-color: white;` は、背景色を白に設定します。
  - `color: black;` は、文字色を黒に設定します。

## JavaScript
JavaScriptは、ウェブページに動的な動作を追加するためのプログラミング言語です。

```html
<script>
    function changeBackgroundColor() {
        const body = document.body;
        if (body.style.backgroundColor === 'white' || body.style.backgroundColor === '') {
            body.style.backgroundColor = 'black';
            body.style.color = 'white';
        } else {
            body.style.backgroundColor = 'white';
            body.style.color = 'black';
        }
    }
</script>
```

### 解説
- `<script>` タグ内にJavaScriptコードを記述します。
- `changeBackgroundColor` 関数は、ページの背景色と文字色を切り替えるための関数です。
  - `const body = document.body;` は、`body` 要素を取得します。
  - `if` 文で、現在の背景色が白かどうかをチェックし、白なら黒に、黒なら白に切り替えます。

このコードでは、`<body>` タグに `onclick="changeBackgroundColor()"` が設定されており、ページのどこかをクリックすると `changeBackgroundColor` 関数が実行され、背景色と文字色が切り替わります。
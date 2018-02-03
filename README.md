Wysiwyg.JS for NPM
==================
Based on a delicious Wysiwyg.JS:
**http://wysiwygjs.github.io/**

This is under development yet.

How to install
==============
It is intended to be used with Webpack 2. In the future there might be stand-alone bundle published.

This package peer-depends on jQuery and Font Awesome. It is up to you how you configure those libraries.

However you should "globalize" jQuery because this is jQuery-plugin modifies `$.fn`, and it relies on jQuery-cached `.data()`. If you ignore "globalizing" of jQuery **this package will not work as expected**.

Webpack 2 + jQuery
------------------
### Method 1: if jQuery is included by old-school method (e.g. from CDN):
1. Include your `bundle.js` which is produced by Webpack 2 **after** including jQuery:
```html
<script
  src="https://code.jquery.com/jquery-3.2.1.min.js"
  integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4="
  crossorigin="anonymous"></script>
<script src="/js-bin/bundle.js"></script>
```
This will register `window.$` and `window.jQuery` globals which will be used by the package.

2. In your `webpack.config.js` add the following section:
```javascript
exports default {
    externals: {
        jquery: 'jQuery',
    },
    entry: // ...
    // ...
}
```
This will make Webpack 2 to rely on the global `window.jQuery` when it sees usages of it.

### Method 2: if you'd like to pack jQuery with your bundle:
In your `webpack.config.js` add the entry point:
```javascript
exports default {
    entry: [
        'jquery', // please ensure to install jQuery via NPM
        './src/Main.js',
    ],
    // ...
}
```

### Installing the package:
`npm install --save-dev https://github.com/shelart/wysiwyg-jquery.git#develop`

How to use
==========
```javascript
import WysiwygJquery from 'wysiwyg-jquery';
WysiwygJquery($('#editor'), {
    callbackWhenEdited: (newHTML) => {
        // callback is called whenever a WYSIWYG editor content is updated (keydown, bold etc.)
    },
    buttons: {
        customButtonKey: { // it's up to you how to name it; you can override default buttons with keys 'bold', 'insertlink', etc.
            title: 'Your tooltip',
            image: '\u0000', // Unicode of FA icon (http://fontawesome.io/cheatsheet/)
            click: ($button) => {
                // ...
            },
            popup: ($popup, $button) => {
                const $modalWindow = $(); // generate the window as jQuery-collection
                $popup.append($modalWindow); // open the popup
                // Call $wysiwyg.wysiwyg('shell').closePopup(); to close the popup from the popup.
                // You can pass $wysiwyg to the modal generation function, for instance
            },
            showstatic: true, // show on the toolbar
            showselection: false, // do not show on the popup toolbar when text selected
        },
    },
    imageUploadUrl: '/upload/image',
    fileUploadUrl: '/upload/file',
);
```

### How to deal with uploading popups

This wrapper includes popups for file & image upload buttons in the WYSIWYG editor. These are written with Bootstrap 3. They should work out of box if your site uses Bootstrap 3. Unfortunately there is no way to customize them yet, but it is planned to add appropriate options, especially i18n dictionary option. Feel free to fork/pull request.

To make the upload routine work you should write a code on the server to deal with forms submitted by the editor.

#### General Upload Principles

A file is submitted via XMLHttpRequest (via `$.ajax()`) HTTP POST request as `multipart/form-data`. The uploaded file will be contained in a field named `image` or `file`.

On MSIE 9 a file will be submitted via `<form />` with `<input type="file" name="image" />` (or `<input type="file" name="file" />`) by invoking its `submit()` method targeted to a temporarily created `<iframe />`.

The server must return a web path of uploaded file.

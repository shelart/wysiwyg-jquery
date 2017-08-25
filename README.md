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
### If jQuery is included by old-school method (e.g. from CDN):
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
```js
exports default {
    externals: {
        jquery: 'jQuery',
    },
    entry: // ...
    // ...
}
```
This will make Webpack 2 to rely on the global `window.jQuery` when it sees usages of it.

### If you'd like to pack jQuery with your bundle:
In your `webpack.config.js` add the entry point:
```js
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
```js
import WysiwygJquery from 'wysiwyg-jquery';
WysiwygJquery($('#editor'));
```

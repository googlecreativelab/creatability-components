# Creatability Accessible Web Components
_in active development_

[Creatability](https://experiments.withgoogle.com/collection/creatability) is a set of experiments made in collaboration with creators and allies in the accessibility community. They explore how creative tools – drawing, music, and more – can be made more accessible using web and AI technology. We hope they inspire others to make new projects, so we've started open-sourcing components here for anyone to use. Note this repo is under development. Contributions welcome!

![using input tracking](https://storage.googleapis.com/creatability-github/creatability-maher.gif)


## Setup an Input

A simple example of toggling between mouse/keyboard and body tracking input.
```html
<acc-input-mode-select oninput="onInput">
    <acc-mouse-input amplification="10"></acc-mouse-input>
    <acc-pose-input smoothing="0.5" selected></acc-pose-input>
</acc-input-mode-select>

<script>
    function onInput(event){
        const input = event.target;
        //position is normalized from -1, 1
        const x = input.position[0];
        const y = input.position[1];
    }
</script>
```

_the simplest example of using this purely in javascript_
```js

const input = document.createElement('acc-pose-input');
//or use document.querySelector('acc-pose-input')

input.addEventListener('input', (event)=>{
    console.log(event.target.position);
});

//this triggers the loading and initialization of any resources
input.initialize();

```


You can of course bind the event the same way with javascript:
```js
const inputSelector = document.querySelector('acc-input-mode-select');

inputSelector.addEventListener('input', (event)=>{
    console.log(event.target.position);
});
```


### Input Event Cycle
All input types dispatch the following events:

* `'initializing'` when the input begins to load and initialize any necessary resources.
* `'ready'` when the input has completed initializing and is now operating
* `'input'` dispatched every time the input has a new value
* `'stop'` dispatched if the input has stopped such as by switching inputs or calling `input.stop()`.
* `'change'` dispatched when an attribute/property changes values


### Input methods
All Input types contain the following methods:

* `input.initialize()` required to begin using the input
* `input.stop()` can be used to stop the input


## Tutorial

The tutorial element gives you a simple slide show. It extends `AbstractModal` so it can be added to the screen by adding an "open" attribute. Each of the `<acc-slide>` children will be rendered as a slide-show.

```html
<acc-tutorial>
    <acc-slide
        video="assets/s1.mp4"
        alt="don't forget to add alt text for the video"
        caption="This experiment lets you combine speech and music in a fun way."></acc-slide>
    <acc-slide
        caption="Just type some words, then set them into your own melody."
        video="assets/s2.mp4"></acc-slide>
    <acc-slide
        caption="You can change the melody using your mouse or keyboard."
        video="assets/s3.mp4"></acc-slide>
    <acc-slide
        caption="Just play around – try different voices, scales, and more."
        video="assets/s4.mp4"></acc-slide>
</acc-tutorial>
```

## Contributors
* [Kyle Phillips](https://github.com/hapticdata)
* [Yotam Mann](https://github.com/tambien)
* [Use All 5](https://github.com/useallfive)



_This is not an official Google product_




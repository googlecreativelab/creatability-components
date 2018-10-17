# Accessible Creativity Web Components


## Setup an Input

_the simplest example of using an input_
```html
<acc-pose-input oninput="onInput" selected></acc-pose-input>

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


### Enabling Selection of multiple Input modes

The following example will render an UI component to enable the selection between each type of input inside its tags.
In this example `<acc-pose-input selected>` starts `selected`, if that attribute was not present it would select the first node.
```html
<acc-input-mode-select oninput="onInput">
    <acc-face-rotation-input wasmsrc="./brfv4.wasm"></acc-face-rotation-input>
    <acc-pose-input selected></acc-pose-input>
    <acc-mouse-input></acc-mouse-input>
</acc-input-mode-select>

<script>
    function onInput(event){
        const input = event.target;
        console.log(input.position);
    }
</script>
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


### Input attributes
All Input types contain the following attributes:

* `selected` if the input is the currently selected node out of the list
* `controls` when true the input will display its calibration panel.


### Input methods
All Input types contain the following methods:

* `input.initialize()` required to begin using the input
* `input.stop()` can be used to stop the input


## Tutorial

The tutorial element gives you a simple slide show. It extends AbstractModal so it can be added to the screen by adding an "open" attribute. Each of the `<acc-slide>` children will be rendered as a slide-show. The Splash page will automatically open this tutorial as will the `<acc-learn-more-group>`

```
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




_This is not an official Google product_




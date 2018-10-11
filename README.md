# Regrowth

🔬 Regrowth is a monstrous laboratory experiment in container queries brought to life.

---

<!-- * Parses all `link` elements and their defined `@import`s. -->
* Parses all `link` elements and extracts all relevant `@media` rules.
* Listens for dynamically added stylesheets using `MutationObserver`.
* Parses the related CSS rules using the browser's internal CSS AST.
* Inserts `iframe` elements relative to each matching selector.
* Attaches resize events on the aformentioned `iframe` elements.
* Updates stylesheets accordingly using [`matchMedia`](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) on resize.

## Getting Started

You use the familiar `@media` rules in your CSS stylesheet &ndash; the only difference is that to make a rule a container query rule, you need to append `container` as a media rule.

```css
@media container and (max-width: 256px) {
    my-element {
        background-color: orange;
    }
}
```

Removing the `container` rule will make the `@media` rule a normal CSS media rule relative to the window's dimensions, as opposed to the element's dimensions. Although we could allow the `container` to be specified anywhere with ease, it's required to be the first rule to make it obvious that the `@media` rule is not a *regular* media query.

In the above example the `my-element` rule will apply to all nested selectors when `screen and (max-width: 256px)` is applicable to the element.

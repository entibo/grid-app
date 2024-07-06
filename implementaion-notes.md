# Zoom

## Custom zoom (not the browser's zoom functionality)

Adjust screen -> grid function to account for scale
Wrap the grid contents in an element with `scale` CSS transform or maybe `zoom`
The grid lines element might need special handling

Mouse wheel with no modifiers is the most ergonomic choice, but this conflicts with trackpad use which uses two-finger `wheel` events for panning

## Browser zoom

Works out of the box

Downsides:

- not smooth
- no control over input method
- zooms relative to top-left of viewport, not cursor
- is rather slow, so can't really be used to zoom all the way in/out frequently

### Can we detect this zoom occuring and adjust panning?

There doesn't seem to be an event emitted when browser zoom changes.

Detect what _likely_ triggers browser zoom: CTRL+wheel or CTRL+[0-+]
A false positive has no consequences as it results in no panning

The cursor position (clientX/clientY) can change when zooming, even if the user's visible cursor didn't move. This offset is what we'll use to adjust panning.

Wheel events include the cursor position (clientX/clientY) BEFORE browser zoom.
How do we get the new cursor position?
Using CTRL+wheel and triggering browser zoom doesn't seem to emit any mouse/pointer move events.
mouse over?

--

So actually there IS a "resize" event which will of course be emitted on browser zoom change. However, it will also be emitted when e.g. resizing the window.

--

devicePixelRatio changes with browser zoom
When "resize" events are emitted, devicePixelRatio is up to date with zoom
Can I compute "new cursor position" based on "previous cursor position" and "delta zoom"?

And use that to offset the panning so that content stays under cursor while zooming?
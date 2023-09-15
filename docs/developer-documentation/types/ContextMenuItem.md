
---
```TS
interface ContextMenuItem {
    text: string,
    callback: (anchorDiv: string) => void
}
```

- `text` is the value shown in the Context menu
- `callback` is the function that will be called 
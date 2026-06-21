### Task 10: Add toast animation to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Add slide-in animation**

Read the current file first, then append this CSS at the end:

```css
.toast-enter {
  animation: slideInRight 0.3s ease-out;
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
```

- [ ] **Commit**

```bash
git add src/app/globals.css
git commit -m "style: add toast slide-in animation"
```

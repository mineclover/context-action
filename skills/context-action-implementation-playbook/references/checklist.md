# Checklist

- Define draft, validation, result, activity, and workflow state up front
- Use `business/` for pure functions only
- Use a state machine when the flow has more than one async phase
- Split handlers by concern instead of keeping one large registry file
- Convert domain events to UI text in handler support or hooks
- Keep views render-only
- Add at least one integration test for invalid, valid, and reset flows
- Register source files and link docs

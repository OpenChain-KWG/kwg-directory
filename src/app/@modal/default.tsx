/**
 * Default fallback for the `@modal` parallel slot.
 *
 * When no intercepting route matches the current URL, the slot renders null
 * so the directory page is unaffected. See:
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/parallel-routes.md
 */
export default function ModalDefault() {
  return null
}

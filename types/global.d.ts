declare const React: typeof import('react')

declare module '*.css' {
  const x: { [any: string]: string }
  export default x
}

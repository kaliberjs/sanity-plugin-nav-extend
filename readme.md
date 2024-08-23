# Sanity plugin nav extend
Extends the nav bar of Sanity Studio

## Installation

```
> yarn add @kaliber/sanity-plugin-nav-extend
```

_`config/default.js`_

```js
{
  kaliber: [
    compileWithBabel: [
      /@kaliber\/sanity-plugin-nav-extend/,
      ...
    ],
    ...
  ],
  ...
}
```

_`admin/sanity.config.js`_

Minimal version

```js
defineConfig({
    ...

    plugins: [
      sanityPluginNavExtend({ clientConfig, reportError }),
      ...
    ],
})
```

Showing a context switch (e.g. language switch)

```js
defineConfig({
    ...

    plugins: [
      sanityPluginNavExtend({
        contextSwitch: {
          profileKey: 'language',
          options: Object.values(clientConfig.multiLanguage.languages).map(
            ({ flagIcon, title, language }) => ({
              id: language,
              label: title,
              icon: <Flag country={flagIcon} />,
            })
          ),
          defaultValue: clientConfig.multiLanguage.defaultLanguage,
        },
        clientConfig,
        reportError
      }),
      ...
    ],
})
```

---

## Development

```
> yarn
> yarn link
```

```
project/> yarn link @kaliber/sanity-plugin-nav-extend
project/> yarn add @kaliber/sanity-plugin-nav-extend@link:./node_modules/@kaliber/sanity-plugin-nav-extend
```

## Publish

```
yarn publish
git push
git push --tags
```

---

## Disclaimer
This library is intended for internal use, we provide __no__ support, use at your own risk.

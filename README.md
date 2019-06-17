# @earshinov/extract-scss-variables

Extract SCSS variables, functions and mixins into a separate file.

## Motivation

LESS provides [reference imports](http://lesscss.org/features/#import-atrules-feature-reference) to only import things like variables and mixins from the given file without affecting the compiled CSS: `@import (reference) "foo.less"`.

In SCSS the same effect can be achieved by using [node-sass custom importers](https://github.com/sass/node-sass#importer--v200---experimental) like [node-sass-filter-importer](https://github.com/maoberlehner/node-sass-magic-importer/tree/master/packages/node-sass-filter-importer) with its `@import '[variables, mixins] from style.scss';`.

Even so, it seems hard to setup, especially if node-sass is being used as part of Webpack or @angular/cli build process.  In many cases you will find it more convenient to extract variables, functions etc. from the file you are interested in into a separate file and import that file normally.  That's what this little tool is for.

## Usage

- `yarn install --dev @earshinov/extract-scss-variables`
- `yarn run extract-scss-variables index.scss variables.scss`

The last command will extract variables, functions and mixins from `index.scss` and its imported files into `variables.scss`.

Example input:

_index.scss_:
```scss
@mixin defaultFont() {
    font-family: Rubik;
    font-weight: normal;
}

@import './button';
```

_button.scss_:
```scss
$buttonBackgroundColor: #e0e0e0;
$buttonColor: black;
$buttonBorderRadius: 4px;

button, input[type=button], input[type=submit] {
    @include defaultFont;
    appearance: none;
    background-color: $buttonBackgroundColor;
    color: $buttonColor;
    border-radius: $buttonBorderRadius;
}
```

Example output:

_index.scss_:
```scss
@import './variables';

@import './button';
```

_button.scss_:
```scss
@import './variables';

button, input[type=button], input[type=submit] {
    @include defaultFont;
    appearance: none;
    background-color: $buttonBackgroundColor;
    color: $buttonColor;
    border-radius: $buttonBorderRadius;
}
```

_variables.scss_:
```scss
@mixin defaultFont() {
    font-family: Rubik;
    font-weight: normal;
}

$buttonBackgroundColor: #e0e0e0;
$buttonColor: black;
$buttonBorderRadius: 4px;
```

## Development

- To install dependencies and run commands, use [Yarn](https://yarnpkg.com/) rather than `npm`
- To lint the code with [ESLint](https://eslint.org/), run `yarn run lint`
- To test the code with [Jest](https://jestjs.io/), run `yarn run test`
- To build NPM package, run `yarn run build`
- To publish NPM package, run `yarn publish --access public`.  The code will be linted, tested and built automatically before publication.

## Useful Links

Inspired by
- [node-sass-filter-importer](https://github.com/maoberlehner/node-sass-magic-importer/tree/master/packages/node-sass-filter-importer)
- [css-node-extract](https://github.com/maoberlehner/css-node-extract/)

SCSS manipulation is implemented using [PostCSS](https://postcss.org/):
- [API documentation](http://api.postcss.org/)
- [AST explorer](https://astexplorer.net/) (In the top menu, select **CSS** and **postcss**.  In postcss options, select **scss** parser.)

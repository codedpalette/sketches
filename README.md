# Sketches

This is a repository for my generative art sketches. I'm using TypeScript with [Pixi.js](https://pixijs.com/) for all my
works, with plans to add [Three.js](https://threejs.org/) (there are some unfinished 3D sketches on a `master_backup`
branch, which I plan to rewrite) and pure WebGL API. You can preview them on my [Github Pages](https://monkeyroar.github.io/sketches/).

**TODO:** Update link

## Installation

I'm using [Yarn Modern](https://yarnpkg.com/) as a package manager, specifically for it's
[package patching](https://yarnpkg.com/features/patching) functionality (sometimes it's the easiest way to fix a bug in
some 3rd party dependency). Although currently i'm not making use of this functionality, I still recommend using it in case
you'd like to run this repo locally. You can find installation instructions [here](https://yarnpkg.com/getting-started/install).

Install dependencies

```bash
yarn install
```

## Usage

### Development

Run a dev server with hot reload (will open in an Electron window)

```bash
yarn start
```

In order to switch to a different sketch, go to `<root>/index.ts` and update the following import at the start of a file

```typescript
import { defaultSizeOptions, Sketch } from "library/core/sketch"
import { initUI } from "library/core/ui"
import factory from "path/to/sketch" // Update path here
```

### Production

Build a library bundle

```bash
yarn build
```

Entry point is `<root>/lib.ts`. It exports all finished artworks along with a `Sketch` class for embedding sketches in pages

**TODO:** Generate JSDoc

## Directory structure

For educational purposes and for future reference I will outline below all top level files and folders in this
repository and what they are for.

- `.github/` - Contains [GitHub Actions](https://github.com/features/actions) descriptions for automatically deploying
latest version of my sketches to [Github Pages](https://pages.github.com/) on every commit to `master` branch
- `.husky/` - [Husky](https://typicode.github.io/husky/) pre-commit hooks
- `.vscode/` - VSCode workspace settings and code snippets
- `.yarn/` - [Yarn Modern](https://yarnpkg.com/) binaries
- `assets/` - Static assets: images, fonts, CSS files etc.
- `library/` - Code unrelated to any specific sketch: setup code, helper and utility functions etc.
- `sketches/` - Actual artworks code grouped by year
- `typings/` - TypeScript [type declarations](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html) for
3rd party libraries that don't provide them
- `.eslintignore`, `.eslintrc.cjs` - [ESLint](https://eslint.org/) linter configuration files
- `.gitignore` - [gitignore](https://git-scm.com/docs/gitignore) file
- `.prettierignore`, `.prettierrc` - [Prettier](https://prettier.io/) formatter configuration files
- `.yarnrc.yml` - [Yarn Modern](https://yarnpkg.com/) configuration
- `electron.js` - [Electron](https://www.electronjs.org/) runner, used for running sketches in dev mode
- `index.html` - Main html file specifying TypeScript entry point and main CSS stylesheet
- `index.ts` - TypeScript entry point for [development workflow](#development)
- `lib.ts` - TypeScript entry point for [library mode](#production)
- `tsconfig.json` - Configuration file for TypeScript compiler, for more info see [here](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
- `vite.config.ts` - [Vite](https://vitejs.dev/) bundler configuration file
- `yarn.lock` - [Yarn lockfile](https://classic.yarnpkg.com/lang/en/docs/yarn-lock/) for consistent and reproducible builds

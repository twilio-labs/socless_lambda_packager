# lambda-packager

<sub>Repo template from [node-typescript-boilerplate](https://github.com/jsynowiec/node-typescript-boilerplate)</sub>

## CLI Args
arg | type | description | Example
--- | --- | ---  | ----
_ | Positional (**required**, do not provide name) | path to parent folder of functions (or layers) folders | `"./functions"`
`language` or `l` | Option   | language of the code to package | `-l=python` or `js` or `ts`
`common` or `c` | Option | path to directory of code (and/or dependencies) that should be included with every package | `-c="./common"`
`useDocker` or `u` | Option | Whether to package inside a container that mimics the AWS environment (recommended for packaging from non-linux machines) | `-u=non-linux` or `-u=true`



## Basics

**Given a directory, for each subfolder:**

1. find a requirements.txt file (if one exists)
2. Download the requirements
3. Zip code and requirements to an archive at a new location

### Finding Functions (or Layers) to package
For the purposes of this library, code intended for a Lambda & code intended for a Lambda Layer is treated the same way.

Provide a directory, and every (top-level) sub folder will be treated as a unique item to package & archive

### Determining Which Requirements To Include

## Metrics
local dev times with m1 max 64gb

| Repo | Packager | Time | 🐳 | # of Functions |
| ---- | ---- | ---- | --- | --- |
| SOCless-core | CLI, no cache | 34s | | 14 |
| SOCless-core | CLI, no cache | 4m51s | 🐳 | 14 |
| SOCless-core | **CLI, static-cache (first run)** | **49s** | 🐳 | 14 |
| SOCless-core | **CLI, static-cache (redeploy)**| **3s** | 🐳 | 14 |
| SOCless-core | **CLI, static-cache (first run on linux)**| **9s** |  | 14 |
| SOCless-core | Socless SLS Plugin  | 4m55s | 🐳 | 14 |
- 6x faster for local dev first run  
- 98x faster for local redeploys  
- 40x (or more) faster in CICD
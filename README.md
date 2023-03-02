# Tracy
Tracy is a Visual Studio Code plugin made to simplify log analysis.

<div align="center">
    <a href="https://github.com/TNO/vscode-tracy">
        <img height="500" src=".github/screenshot.png">
    </a>
</div>

## Installation
To install Tracy in Visual Studio Code:
1. Obtain the plugin `.vsix` file:
    - If you want to install the latest release, go to the [Latest release](https://github.com/TNO/vscode-tracy/releases/latest) and download the `vscode-tracy-X.X.X.vsix` file under *Assests*.
    - If you want to install a specific commit, click on the :heavy_check_mark: next to the commit -> *Details* -> *Summary* -> under *Artifacts*, *vscode-vsix* and extract the downloaded `vscode-vsix.zip`.
1. Open Visual Studio Code, in the side bar go to *Extensions* -> `···` (right top) -> *Install from VSIX...* -> open the downloaded `vscode-tracy-X.X.X.vsix`.
1. Tracy is now installed and will be used as the default viewer for all `*.tracy.json` files. You can download an `example.tracy.json` from [here](https://github.com/TNO/vscode-tracy/raw/main/examples/dummy.tracy.json.zip) (extract before opening).
1. If you want to upgrade Tracy in the future, repeat the instructions above.

## Developing
To develop Tracy:
1. Make sure that [Node.js](https://nodejs.org/en/) (version 18+ recommended) and [Git](https://git-scm.com/) are installed.
1. Execute: 
    ```bash
    # Clone the repository
    git clone https://github.com/TNO/vscode-tracy.git
    cd IGTS-IC-Log-Analyzer
    # Install dependencies
    npm ci 
    # Open the repository in Visual Studio Code
    code .
    # Start the viewer in watch mode such that changes to src/viewer/* are applied on-the-fly
    npm run watch-viewer
    ```
1. In Vistual Studio Code, go to *Run* (menu bar) -> *Start Debugging*. A new Visual Studio Code instance (*Extension Development Host*) will be started with Tracy installed. Open a `*.tracy.json` file to see the viewer.
    - Changes made to `src/viewer/*` are applied on-the-fly as long as `npm run watch-viewer` from the previous step is running. You only need to close the viewer and re-open the `*.tracy.json` file.
    - Changes made to `src/extension/*` are **NOT** applied on-the-fly, to apply them go to *Run* (menu bar) -> *Restart Debugging*.

## Creating a new release
To create a new release, go to the [CI GitHub action](https://github.com/TNO/vscode-tracy/actions/workflows/ci.yml) -> *Run workflow* -> adjust type accordingly -> *Run workflow*. Wait till build completes and add the [release notes](https://github.com/TNO/vscode-tracy/releases/latest).

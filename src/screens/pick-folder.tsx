import {invoke} from '@tauri-apps/api/core';
import {useState} from "react";

export function PickFolderScreen() {
    const [path, setPath] = useState<undefined | string>()
    const [scanResult, setScanResult] = useState<undefined | string[]>()
    const [error, setError] = useState<undefined | string>()

    const open = async () => {
        const p = await invoke('select_directory_desktop')

        return setPath(p as string)
    };

    const cancel = () => {
        setPath(undefined)
        setScanResult(undefined)
        setError(undefined)
    }

    const scan = async () => {
        try {
            const r = await invoke('scan_selected_directory', {path})

            return setScanResult(r as string[])
        } catch (error) {
            // @ts-ignore
            setError("ERROR: " + error)
        }
    }

    return <div className="screen">
        <h1>Choisir un dossier à scanner</h1>

        <div className="button-group">
            <button onClick={open}>Choisir un dossier</button>
            <button onClick={cancel}>Annuler</button>
        </div>

        {path && <p>Dossier sélectionné : {path}</p>}

        {path && <button onClick={scan}>Scanner</button>}

        {error && <p className="error">{error}</p>}

        {scanResult && <ul>{scanResult.map(file => <li key={file}>{file}</li>)}</ul>}
    </div>
}
import { invoke } from "@tauri-apps/api/core";
import { useReducer } from "react";
import { info } from "@tauri-apps/plugin-log";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type State =
  | {
      error: undefined | string;
      path: string;
      scanResult: undefined | string[];
      status: "picked";
    }
  | {
      error: undefined;
      path: string;
      scanResult: string[];
      status: "succeed";
    }
  | {
      error: undefined;
      path: undefined;
      scanResult: undefined;
      status: "pending";
    }
  | {
      error: string;
      path: string;
      scanResult: undefined;
      status: "failed";
    }
  | {
      error: undefined | string;
      path: string;
      scanResult: undefined | string[];
      status: "loading";
    };

type Action =
  | {
      type: "cancel";
    }
  | {
      type: "loading";
    }
  | {
      type: "select_folder";
      payload: string;
    }
  | {
      type: "scan_succeed";
      payload: string[];
    }
  | {
      type: "scan_failed";
      payload: string;
    };

const initialState = {
  path: undefined,
  scanResult: undefined,
  error: undefined,
  status: "pending",
} satisfies State;

function scanReducer(state: State, action: Action): State {
  if (action.type === "cancel") {
    return { ...initialState };
  }

  if (action.type === "loading") {
    return { ...state, path: state.path as string, status: "loading" };
  }

  if (action.type === "select_folder") {
    return {
      path: action.payload,
      scanResult: undefined,
      error: undefined,
      status: "picked",
    };
  }

  if (action.type === "scan_succeed") {
    return {
      path: state.path as string,
      scanResult: action.payload,
      error: undefined,
      status: "succeed",
    };
  }

  return {
    path: state.path as string,
    scanResult: undefined,
    error: action.payload,
    status: "failed",
  };
}

export function PickFolderScreen() {
  const [{ path, scanResult, error, status }, dispatch] = useReducer(
    scanReducer,
    { ...initialState },
  );

  const open = async () => {
    const p = await invoke("select_directory_desktop");

    return dispatch({ type: "select_folder", payload: p as string });
  };

  const cancel = () => {
    dispatch({ type: "cancel" });
  };

  const scan = async () => {
    try {
      const rPromise = invoke("scan_selected_directory", { path });

      dispatch({ type: "loading" });

      await delay(2000);

      const r = await rPromise;

      return dispatch({ type: "scan_succeed", payload: r as string[] });
    } catch (error) {
      // @ts-ignore
      return dispatch({ type: "scan_failed", payload: error as string });
    }
  };

  return (
    <div className="screen">
      <h1>Choisir un dossier à scanner</h1>

      <div className="button-group">
        <button onClick={open}>Choisir un dossier</button>
        <button onClick={cancel}>Annuler</button>
      </div>

      {path && <p>Dossier sélectionné : {path}</p>}

      {path && <button onClick={scan}>Scanner</button>}

      {status === "loading" && (
        <div style={{ marginTop: "24px", marginBottom: "24px" }}>
          <span className="loader"></span>
        </div>
      )}

      {status === "failed" && <p className="error">{error}</p>}

      {status === "succeed" && scanResult.length > 0 && (
        <ul>
          {scanResult.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      )}

      {status === "succeed" && scanResult.length === 0 && (
        <p>Aucun fichier corrompu trouvé</p>
      )}
    </div>
  );
}

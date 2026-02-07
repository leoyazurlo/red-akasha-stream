import { useRef, useCallback } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: "typescript" | "javascript" | "sql" | "json" | "html" | "css";
  readOnly?: boolean;
  height?: string;
  theme?: "vs-dark" | "light";
}

export function MonacoEditor({
  value,
  onChange,
  language = "typescript",
  readOnly = false,
  height = "400px",
  theme = "vs-dark",
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure TypeScript/JavaScript settings
    if (language === "typescript" || language === "javascript") {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: "React",
        allowJs: true,
        typeRoots: ["node_modules/@types"],
      });

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      // Add React types
      const reactTypes = `
        declare namespace React {
          function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
          function useEffect(effect: () => void | (() => void), deps?: any[]): void;
          function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
          function useMemo<T>(factory: () => T, deps: any[]): T;
          function useRef<T>(initialValue: T): { current: T };
          function memo<P>(Component: React.FC<P>): React.FC<P>;
          interface FC<P = {}> { (props: P): JSX.Element | null; }
          interface ReactNode {}
        }
        declare namespace JSX {
          interface Element {}
          interface IntrinsicElements {
            div: any; span: any; p: any; h1: any; h2: any; h3: any; h4: any; h5: any; h6: any;
            button: any; input: any; form: any; label: any; select: any; option: any; textarea: any;
            a: any; img: any; ul: any; ol: any; li: any; table: any; tr: any; td: any; th: any;
            header: any; footer: any; main: any; section: any; article: any; nav: any; aside: any;
          }
        }
      `;

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        reactTypes,
        "file:///node_modules/@types/react/index.d.ts"
      );
    }

    // Custom theme matching Red Akasha
    monaco.editor.defineTheme("akasha-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955" },
        { token: "keyword", foreground: "22D3EE" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
      ],
      colors: {
        "editor.background": "#0A0A0F",
        "editor.foreground": "#D4D4D4",
        "editor.lineHighlightBackground": "#1A1A2E",
        "editorCursor.foreground": "#22D3EE",
        "editor.selectionBackground": "#22D3EE33",
        "editorLineNumber.foreground": "#4B5563",
        "editorLineNumber.activeForeground": "#22D3EE",
      },
    });

    monaco.editor.setTheme("akasha-dark");
  };

  const handleChange: OnChange = useCallback(
    (newValue) => {
      if (onChange && newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <div className="border border-cyan-500/20 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full bg-background">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          acceptSuggestionOnEnter: "on",
          folding: true,
          foldingHighlight: true,
          bracketPairColorization: { enabled: true },
          renderWhitespace: "selection",
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}

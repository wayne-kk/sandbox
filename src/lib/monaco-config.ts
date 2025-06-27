// Monaco 编辑器配置工具
export class MonacoConfig {
  private static isConfigured = false;
  private static monacoInstance: any = null;
  private static refreshTimeout: NodeJS.Timeout | null = null;

  /**
   * 配置Monaco编辑器以减少TypeScript红线错误
   */
  static configureTypeScript(monaco: any) {
    // 避免重复配置同一个monaco实例
    if (this.monacoInstance === monaco && this.isConfigured) {
      return;
    }

    this.monacoInstance = monaco;

    // 配置TypeScript编译器选项 - 减少严格检查
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ES2020,
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
      baseUrl: '.',

      // 减少严格检查，避免过多红线
      strict: false,
      noImplicitAny: false,
      strictNullChecks: false,
      strictFunctionTypes: false,
      strictBindCallApply: false,
      strictPropertyInitialization: false,
      noImplicitReturns: false,
      noImplicitThis: false,
      noUnusedLocals: false,
      noUnusedParameters: false,
      exactOptionalPropertyTypes: false,
      noImplicitOverride: false,
      noPropertyAccessFromIndexSignature: false,
      noUncheckedIndexedAccess: false,
      allowUmdGlobalAccess: true,

      // 库配置
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      skipLibCheck: true,
      skipDefaultLibCheck: true,
    });

    // JavaScript编译器选项 - 完全禁用TypeScript特性检查
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: false, // 禁用JS检查
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,

      // 禁用所有类型检查
      noImplicitAny: false,
      strictNullChecks: false,
      strictFunctionTypes: false,
      noImplicitReturns: false,
      noImplicitThis: false,
      strict: false,

      // 额外禁用
      noUnusedLocals: false,
      noUnusedParameters: false,
      exactOptionalPropertyTypes: false,
      noImplicitOverride: false,
      noPropertyAccessFromIndexSignature: false,
      noUncheckedIndexedAccess: false,
      skipLibCheck: true,
      skipDefaultLibCheck: true,
    });

    // 通用的忽略错误列表 - 扩展更多错误码
    const commonIgnoredCodes = [
      // TypeScript in JS files - 扩展范围
      ...Array.from({ length: 50 }, (_, i) => 8000 + i), // 8000-8049
      // 语法错误
      1005, 1109, 1128, 1160, 1161, 1003, 1009, 1434, 1002, 1004, 1014, 1015,
      // 类型错误 - 大幅扩展
      2304, 2307, 2345, 2339, 2322, 2571, 2578, 2580, 2792, 2300, 2305, 2306, 2308, 2309,
      2344, 2346, 2347, 2348, 2349, 2350, 2351, 2352, 2353, 2354, 2355, 2356,
      2370, 2371, 2372, 2373, 2374, 2375, 2376, 2377, 2378, 2379, 2380, 2381,
      2550, 2551, 2552, 2553, 2554, 2555, 2556, 2557, 2558, 2559, 2560, 2561,
      // 未使用变量/参数
      6133, 6196, 6385, 6138, 6139, 6140, 6141, 6142, 6143, 6144, 6145,
      // 不可达代码
      7027, 7006, 7009, 7053, 7028, 7029, 7030, 7031, 7032, 7033, 7034,
      // React相关
      2769, 2740, 2749, 2741, 2742, 2743, 2744, 2745, 2746, 2747, 2748,
      // Next.js相关
      2497, 2498, 2499, 2500, 2501, 2502, 2503, 2504, 2505,
    ];

    // 配置TypeScript诊断选项
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      onlyOpenFiles: true,
      diagnosticCodesToIgnore: commonIgnoredCodes
    });

    // JavaScript诊断选项 - 更激进的禁用
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true, // 完全禁用JS语义验证
      noSyntaxValidation: false,   // 保留基本语法检查
      onlyOpenFiles: true,
      diagnosticCodesToIgnore: [
        ...commonIgnoredCodes,
        // 额外禁用所有8000+的错误码（TypeScript特性相关）
        ...Array.from({ length: 100 }, (_, i) => 8000 + i)
      ]
    });

    this.isConfigured = true;

    // 注入常用类型定义
    this.addReactTypes(monaco);
    this.addNextTypes(monaco);
    this.addCommonLibTypes(monaco);
  }

  /**
   * 防抖的JavaScript配置刷新（用于解决切换时的红线问题）
   */
  static refreshJavaScriptConfig(monaco: any) {
    // 清除之前的定时器
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // 立即清理所有错误标记（不等待防抖）
    const models = monaco.editor.getModels();
    models.forEach((model: any) => {
      if (model.getLanguageId() === 'javascript') {
        monaco.editor.setModelMarkers(model, 'typescript', []);
        monaco.editor.setModelMarkers(model, 'javascript', []);
        monaco.editor.setModelMarkers(model, 'ts', []);
        monaco.editor.setModelMarkers(model, 'js', []);
      }
    });

    this.refreshTimeout = setTimeout(() => {
      // 重新应用JavaScript配置
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
        onlyOpenFiles: true,
        diagnosticCodesToIgnore: [
          // 禁用所有可能的TypeScript相关错误
          ...Array.from({ length: 200 }, (_, i) => 8000 + i),
          2304, 2307, 2345, 2339, 2322, 2571, 2578, 2580, 2792,
          6133, 6196, 6385, 7027, 7006, 7009, 7053,
          2769, 2740, 2749, 2497
        ]
      });

      // 强制清除所有JavaScript模型的错误标记（再次清理）
      models.forEach((model: any) => {
        if (model.getLanguageId() === 'javascript') {
          monaco.editor.setModelMarkers(model, 'typescript', []);
          monaco.editor.setModelMarkers(model, 'javascript', []);
          monaco.editor.setModelMarkers(model, 'ts', []);
          monaco.editor.setModelMarkers(model, 'js', []);

          // 强制刷新模型验证
          try {
            monaco.editor.setModelLanguage(model, 'javascript');
          } catch (e) {
            console.log('Language already set to javascript');
          }
        }
      });
    }, 50); // 50ms防抖延迟
  }

  /**
   * 强制清除所有错误标记（紧急使用）
   */
  static forceCleanMarkers(monaco: any, languageId?: string) {
    const models = monaco.editor.getModels();
    models.forEach((model: any) => {
      if (!languageId || model.getLanguageId() === languageId) {
        // 清除所有可能的错误标记源
        ['typescript', 'javascript', 'ts', 'js', 'eslint', 'tslint'].forEach(source => {
          monaco.editor.setModelMarkers(model, source, []);
        });
      }
    });
  }

  /**
   * 添加React类型定义
   */
  static addReactTypes(monaco: any) {
    const reactTypeDefs = `
      declare module 'react' {
        export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
          type: T;
          props: P;
          key: Key | null;
        }
        export type Key = string | number;
        export type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
        export type ReactFragment = {} & Iterable<ReactNode>;
        export type ReactPortal = {};
        export type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null) | (new (props: P) => Component<P, any>);
        
        export class Component<P = {}, S = {}> {
          props: Readonly<P>;
          state: Readonly<S>;
          constructor(props: P);
          render(): ReactNode;
        }
        
        export interface FunctionComponent<P = {}> {
          (props: P, context?: any): ReactElement<any, any> | null;
          propTypes?: any;
          contextTypes?: any;
          defaultProps?: Partial<P>;
        }
        
        export type FC<P = {}> = FunctionComponent<P>;
        
        // Hooks
        export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void];
        export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
        export function useMemo<T>(factory: () => T, deps: any[]): T;
        export function useRef<T>(initialValue: T): { current: T };
        export function useRef<T = undefined>(): { current: T | undefined };
        export function useReducer<R extends Reducer<any, any>>(reducer: R, initialState: ReducerState<R>): [ReducerState<R>, Dispatch<ReducerAction<R>>];
        export function useContext<T>(context: Context<T>): T;
        export function createContext<T>(defaultValue: T): Context<T>;
        
        export interface Context<T> {
          Provider: Provider<T>;
          Consumer: Consumer<T>;
        }
        
        export interface Provider<T> {
          (props: { value: T; children?: ReactNode }): ReactElement | null;
        }
        
        export interface Consumer<T> {
          (props: { children: (value: T) => ReactNode }): ReactElement | null;
        }
        
        export type Reducer<S, A> = (prevState: S, action: A) => S;
        export type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
        export type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;
        export type Dispatch<A> = (value: A) => void;
        
        export default React;
      }
      
      declare module 'react-dom' {
        export function render(element: React.ReactElement, container: Element | null): void;
        export function createRoot(container: Element): {
          render(element: React.ReactElement): void;
          unmount(): void;
        };
        export default ReactDOM;
      }
      
      declare module 'react-dom/client' {
        export function createRoot(container: Element): {
          render(element: React.ReactElement): void;
          unmount(): void;
        };
      }
      
      declare global {
        namespace JSX {
          interface Element extends React.ReactElement<any, any> {}
          interface IntrinsicElements {
            [elemName: string]: any;
          }
          interface ElementAttributesProperty {
            props: {};
          }
          interface ElementChildrenAttribute {
            children: {};
          }
        }
        
        var React: typeof import('react');
      }
    `;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      reactTypeDefs,
      'file:///node_modules/@types/react/index.d.ts'
    );
  }

  /**
   * 添加Next.js类型定义
   */
  static addNextTypes(monaco: any) {
    const nextTypeDefs = `
      declare module 'next' {
        export interface NextConfig {
          [key: string]: any;
        }
        export default NextConfig;
      }
      
      declare module 'next/link' {
        import { ReactNode } from 'react';
        export interface LinkProps {
          href: string;
          children: ReactNode;
          as?: string;
          replace?: boolean;
          scroll?: boolean;
          shallow?: boolean;
          passHref?: boolean;
          prefetch?: boolean;
          locale?: string;
          [key: string]: any;
        }
        export default function Link(props: LinkProps): JSX.Element;
      }
      
      declare module 'next/image' {
        export interface ImageProps {
          src: string;
          alt: string;
          width?: number;
          height?: number;
          fill?: boolean;
          quality?: number;
          priority?: boolean;
          placeholder?: 'blur' | 'empty';
          style?: React.CSSProperties;
          className?: string;
          [key: string]: any;
        }
        export default function Image(props: ImageProps): JSX.Element;
      }
      
      declare module 'next/head' {
        import { ReactNode } from 'react';
        export interface HeadProps {
          children: ReactNode;
        }
        export default function Head(props: HeadProps): JSX.Element;
      }
      
      declare module 'next/router' {
        export interface NextRouter {
          route: string;
          pathname: string;
          query: { [key: string]: string | string[] };
          asPath: string;
          push(url: string): Promise<boolean>;
          replace(url: string): Promise<boolean>;
          back(): void;
        }
        export function useRouter(): NextRouter;
        export default NextRouter;
      }
    `;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      nextTypeDefs,
      'file:///node_modules/@types/next/index.d.ts'
    );
  }

  /**
   * 添加常用库的类型定义
   */
  static addCommonLibTypes(monaco: any) {
    const commonTypeDefs = `
      declare module 'lucide-react' {
        export interface IconProps {
          size?: number;
          color?: string;
          strokeWidth?: number;
          className?: string;
          [key: string]: any;
        }
        export const FileText: React.FC<IconProps>;
        export const Save: React.FC<IconProps>;
        export const Play: React.FC<IconProps>;
        export const Settings: React.FC<IconProps>;
        export const FolderTree: React.FC<IconProps>;
        export const Download: React.FC<IconProps>;
        export const Upload: React.FC<IconProps>;
        export const GitBranch: React.FC<IconProps>;
        export const Split: React.FC<IconProps>;
        export const Loader2: React.FC<IconProps>;
        export const AlertCircle: React.FC<IconProps>;
        export const ArrowLeft: React.FC<IconProps>;
      }
      
      declare module '@monaco-editor/react' {
        export interface EditorProps {
          height?: string | number;
          width?: string | number;
          language?: string;
          value?: string;
          defaultValue?: string;
          theme?: string;
          options?: any;
          onChange?: (value: string | undefined) => void;
          onMount?: (editor: any, monaco: any) => void;
          loading?: React.ReactNode;
        }
        export const Editor: React.FC<EditorProps>;
        export default Editor;
      }
      
      declare var process: {
        env: { [key: string]: string | undefined };
      };
      
      declare var console: {
        log(...args: any[]): void;
        error(...args: any[]): void;
        warn(...args: any[]): void;
        info(...args: any[]): void;
      };
    `;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      commonTypeDefs,
      'file:///node_modules/@types/common/index.d.ts'
    );
  }

  /**
   * 完整配置Monaco编辑器
   */
  static configure(monaco: any) {
    this.configureTypeScript(monaco);
    this.addReactTypes(monaco);
    this.addNextTypes(monaco);
    this.addCommonLibTypes(monaco);

    // 启用更好的模型同步
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  }

  /**
   * 获取优化的编辑器选项
   */
  static getEditorOptions(overrides: any = {}) {
    return {
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      theme: 'vs-dark',

      // 智能建议配置
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      acceptSuggestionOnCommitCharacter: true,
      snippetSuggestions: 'bottom',

      // 错误标记配置
      renderValidationDecorations: 'on',

      // 滚动配置
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },

      // 光标配置
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',

      // 代码折叠
      folding: true,
      foldingStrategy: 'indentation',

      // 括号匹配
      matchBrackets: 'always',

      // 选择高亮
      selectionHighlight: true,
      occurrencesHighlight: 'singleFile',

      // 格式化
      formatOnPaste: true,
      formatOnType: true,

      // 多光标
      multiCursorModifier: 'ctrlCmd',

      // 其他优化
      renderLineHighlight: 'all',
      renderWhitespace: 'selection',
      smoothScrolling: true,

      ...overrides
    };
  }
} 
"use client";

import React, { useCallback, useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { MonacoConfig } from '@/lib/monaco-config';

interface EditorProps {
  language: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  options?: any;
  fileName?: string; // 添加文件名参数用于更好的语言检测
}

export default function Editor({ language, value, onChange, options = {}, fileName }: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any | null>(null);

  // 使用 useCallback 包装 onChange 避免依赖警告
  const handleChange = useCallback((newValue: string | undefined) => {
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  // 智能语言检测
  const getActualLanguage = useCallback((lang: string, filename?: string) => {
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'js':
        case 'mjs':
        case 'cjs':
          return 'javascript';
        case 'jsx':
          return 'javascript'; // JSX 使用 javascript 模式避免 TypeScript 检查
        case 'ts':
          return 'typescript';
        case 'tsx':
          return 'typescript';
        case 'json':
          return 'json';
        case 'css':
          return 'css';
        case 'scss':
        case 'sass':
          return 'scss';
        case 'html':
        case 'htm':
          return 'html';
        case 'md':
        case 'markdown':
          return 'markdown';
        default:
          break;
      }
    }

    // 如果传入的是 typescript 但内容看起来像纯 JavaScript，降级为 javascript
    if (lang === 'typescript' && value) {
      const hasTypeScriptFeatures = /(?:interface\s+\w+|type\s+\w+\s*=|:\s*\w+|<\w+>|\sas\s+\w+|import\s+type)/i.test(value);
      if (!hasTypeScriptFeatures) {
        return 'javascript';
      }
    }

    return lang;
  }, [value]);

  // 配置Monaco编辑器
  const handleEditorDidMount = (editor: any, monaco: any) => {
    // 初始化Monaco配置
    MonacoConfig.configureTypeScript(monaco);

    // 设置语言和主题
    const detectedLanguage = getActualLanguage(language, fileName);
    monaco.editor.setModelLanguage(editor.getModel(), detectedLanguage);

    editorRef.current = editor;
    monacoRef.current = monaco;

    // 如果是JavaScript文件，立即强力清理并刷新配置
    if (detectedLanguage === 'javascript') {
      MonacoConfig.forceCleanMarkers(monaco, 'javascript');
      MonacoConfig.refreshJavaScriptConfig(monaco);

      // 多重延迟清理确保彻底
      setTimeout(() => MonacoConfig.forceCleanMarkers(monaco, 'javascript'), 100);
      setTimeout(() => MonacoConfig.forceCleanMarkers(monaco, 'javascript'), 300);
      setTimeout(() => MonacoConfig.forceCleanMarkers(monaco, 'javascript'), 500);
    }

    // 监听语言变化，处理自动切换的情况
    editor.getModel().onDidChangeLanguage(() => {
      const currentLanguage = editor.getModel().getLanguageId();
      console.log('Language changed to:', currentLanguage);

      if (currentLanguage === 'javascript') {
        // 立即清理并延迟刷新JS配置
        MonacoConfig.forceCleanMarkers(monaco, 'javascript');
        setTimeout(() => {
          MonacoConfig.refreshJavaScriptConfig(monaco);
          MonacoConfig.forceCleanMarkers(monaco, 'javascript');
        }, 50);
      }
    });

    // 监听模型内容变化，持续清理JavaScript文件的错误
    let contentChangeTimeout: NodeJS.Timeout;
    editor.getModel().onDidChangeContent(() => {
      const currentLanguage = editor.getModel().getLanguageId();
      if (currentLanguage === 'javascript') {
        // 防抖清理
        clearTimeout(contentChangeTimeout);
        contentChangeTimeout = setTimeout(() => {
          MonacoConfig.forceCleanMarkers(monaco, 'javascript');
        }, 150);
      }
    });
  };

  // 监听代码和文件名变化
  useEffect(() => {
    if (editorRef.current && monacoRef.current && fileName) {
      const newLanguage = getActualLanguage(language, fileName);
      const currentLanguage = editorRef.current.getModel()?.getLanguageId();

      if (newLanguage !== currentLanguage) {
        console.log('Switching language from', currentLanguage, 'to', newLanguage);

        const model = editorRef.current.getModel();

        // 立即强制清除所有错误标记
        MonacoConfig.forceCleanMarkers(monacoRef.current);

        // 切换语言
        monacoRef.current.editor.setModelLanguage(model, newLanguage);

        // 针对不同语言类型的特殊处理
        if (newLanguage === 'javascript') {
          // JavaScript: 立即和延迟双重处理
          MonacoConfig.forceCleanMarkers(monacoRef.current, 'javascript');
          MonacoConfig.refreshJavaScriptConfig(monacoRef.current);

          // 额外的延迟清理，确保没有残留
          setTimeout(() => {
            MonacoConfig.forceCleanMarkers(monacoRef.current, 'javascript');
          }, 200);

        } else if (newLanguage === 'typescript') {
          // TypeScript: 重新配置
          setTimeout(() => {
            MonacoConfig.configureTypeScript(monacoRef.current);
          }, 50);
        }

        // 最后的兜底清理
        setTimeout(() => {
          if (editorRef.current?.getModel()?.getLanguageId() === 'javascript') {
            MonacoConfig.forceCleanMarkers(monacoRef.current, 'javascript');
          }
        }, 500);
      }
    }
  }, [language, fileName, getActualLanguage]);

  // 监听value变化，在某些情况下清理错误
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const currentLanguage = editorRef.current.getModel()?.getLanguageId();
      if (currentLanguage === 'javascript') {
        // 延迟清理，避免在输入时显示不必要的错误
        const cleanup = setTimeout(() => {
          MonacoConfig.forceCleanMarkers(monacoRef.current, 'javascript');
        }, 300);

        return () => clearTimeout(cleanup);
      }
    }
  }, [value]);

  // 获取实际使用的语言
  const actualLanguage = getActualLanguage(language, fileName);

  // 获取编辑器选项
  const editorOptions = MonacoConfig.getEditorOptions({
    ...options,
    // 根据语言类型调整选项
    ...(actualLanguage === 'javascript' && {
      // JavaScript文件的特殊配置
      typescript: {
        validate: false, // 禁用TypeScript验证
      }
    })
  });

  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <MonacoEditor
        height="100%"
        language={actualLanguage}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={editorOptions}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-900 text-white">
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span>加载编辑器中...</span>
            </div>
          </div>
        }
      />
    </div>
  );
} 
"use client";

import React, { useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';

interface EditorProps {
  language: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  options?: any;
}

export default function Editor({ language, value, onChange, options = {} }: EditorProps) {
  // 使用 useCallback 包装 onChange 避免依赖警告
  const handleChange = useCallback((newValue: string | undefined) => {
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  const defaultOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    theme: 'vs-dark',
    ...options
  };

  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        theme="vs-dark"
        options={defaultOptions}
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
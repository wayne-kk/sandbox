'use client';

import ProjectGenerationWorkflow from '@/components/AI/ProjectGenerationWorkflow';

export default function ProjectWorkflowPage() {
  const handleProjectGenerated = (result: any) => {
    console.log('项目生成完成:', result);
    // 可以在这里添加成功后的处理逻辑
  };

  const handlePreview = (url: string) => {
    // 打开预览窗口
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">🚀 完整项目生成工作流</h1>
          <p className="text-gray-600 text-lg">
            从需求描述到完整项目，一键生成
          </p>
        </div>

        <ProjectGenerationWorkflow
          projectId="workflow-project"
          onProjectGenerated={handleProjectGenerated}
          onPreview={handlePreview}
        />
      </div>
    </div>
  );
}

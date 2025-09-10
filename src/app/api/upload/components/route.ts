import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 检查文件类型
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: '只支持zip文件格式' }, { status: 400 });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    
    try {
      const zipContent = await zip.loadAsync(arrayBuffer);
      
      // 创建组件目录
      const componentsDir = path.join(process.cwd(), 'sandbox', 'components');
      await mkdir(componentsDir, { recursive: true });

      const extractedFiles: string[] = [];
      const componentNames: string[] = [];

      // 遍历zip文件中的所有文件
      for (const [relativePath, file] of Object.entries(zipContent.files)) {
        // 过滤条件：
        // 1. 不是目录
        // 2. 是.tsx文件
        // 3. 不是macOS隐藏文件（不以._开头）
        // 4. 不在__MACOSX目录中
        if (!file.dir && 
            relativePath.endsWith('.tsx') &&
            !path.basename(relativePath).startsWith('._') &&
            !relativePath.includes('__MACOSX')) {
          
          // 获取文件内容
          const content = await file.async('string');
          
          // 获取文件名
          const fileName = path.basename(relativePath);
          const componentName = fileName.replace('.tsx', '');
          
          // 验证组件名是有效的JavaScript标识符
          if (/^[A-Za-z][A-Za-z0-9]*$/.test(componentName)) {
            // 保存文件到 sandbox/components 目录
            const filePath = path.join(componentsDir, fileName);
            await writeFile(filePath, content, 'utf8');
            
            extractedFiles.push(fileName);
            componentNames.push(componentName);
          } else {
            console.warn(`跳过无效的组件名: ${componentName}`);
          }
        }
      }

      // 生成组件列表数据用于页面展示
      const componentList = componentNames.map(name => ({
        name,
        fileName: `${name}.tsx`,
        imported: false
      }));

      return NextResponse.json({
        success: true,
        message: `成功提取 ${extractedFiles.length} 个组件`,
        extractedFiles,
        componentNames,
        componentList,
        componentsDir: 'sandbox/components'
      });

    } catch (zipError) {
      console.error('解压缩失败:', zipError);
      return NextResponse.json({ error: '解压缩文件失败，请检查zip文件格式' }, { status: 400 });
    }

  } catch (error) {
    console.error('上传处理错误:', error);
    return NextResponse.json(
      { error: '文件处理失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
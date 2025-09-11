import { NextRequest, NextResponse } from 'next/server';

interface FeishuMessage {
    msg_type: string;
    content: {
        text?: string;
        post?: {
            zh_cn: {
                title: string;
                content: Array<Array<{ tag: string; text: string; href?: string }>>;
            };
        };
    };
}

interface DeploymentNotification {
    status: 'started' | 'success' | 'failed';
    project: string;
    environment: string;
    duration?: number;
    error?: string;
    url?: string;
    timestamp: string;
}

export async function POST(request: NextRequest) {
    try {
        const notification: DeploymentNotification = await request.json();

        const webhookUrl = process.env.FEISHU_WEBHOOK_URL;
        if (!webhookUrl) {
            console.warn('飞书 Webhook URL 未配置');
            return NextResponse.json({ success: false, error: '飞书 Webhook URL 未配置' });
        }

        const message = createFeishuMessage(notification);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`飞书通知发送失败: ${response.status}`);
        }

        const result = await response.json();

        return NextResponse.json({
            success: true,
            message: '飞书通知发送成功',
            feishuResponse: result
        });

    } catch (error) {
        console.error('飞书通知发送失败:', error);
        return NextResponse.json(
            { success: false, error: '飞书通知发送失败' },
            { status: 500 }
        );
    }
}

function createFeishuMessage(notification: DeploymentNotification): FeishuMessage {
    const { status, project, environment, duration, error, url, timestamp } = notification;

    const statusEmoji = {
        started: '🚀',
        success: '✅',
        failed: '❌'
    };

    const statusText = {
        started: '开始部署',
        success: '部署成功',
        failed: '部署失败'
    };

    if (status === 'started') {
        return {
            msg_type: 'text',
            content: {
                text: `${statusEmoji[status]} **${project}** ${statusText[status]}\n\n` +
                    `🌍 环境: ${environment}\n` +
                    `⏰ 时间: ${timestamp}\n` +
                    `📦 项目: V0 Sandbox`
            }
        };
    }

    if (status === 'success') {
        return {
            msg_type: 'post',
            content: {
                post: {
                    zh_cn: {
                        title: `${statusEmoji[status]} ${project} 部署成功`,
                        content: [
                            [
                                { tag: 'text', text: `🎉 部署完成！` },
                                { tag: 'at', text: 'all' }
                            ],
                            [
                                { tag: 'text', text: `\n📦 项目: ` },
                                { tag: 'text', text: `${project}`, href: url }
                            ],
                            [
                                { tag: 'text', text: `\n🌍 环境: ` },
                                { tag: 'text', text: `${environment}` }
                            ],
                            [
                                { tag: 'text', text: `\n⏱️ 耗时: ` },
                                { tag: 'text', text: `${duration ? Math.round(duration / 1000) : 'N/A'} 秒` }
                            ],
                            [
                                { tag: 'text', text: `\n🔗 访问地址: ` },
                                { tag: 'a', text: '点击访问', href: url || '#' }
                            ],
                            [
                                { tag: 'text', text: `\n⏰ 完成时间: ${timestamp}` }
                            ]
                        ]
                    }
                }
            }
        };
    }

    if (status === 'failed') {
        return {
            msg_type: 'post',
            content: {
                post: {
                    zh_cn: {
                        title: `${statusEmoji[status]} ${project} 部署失败`,
                        content: [
                            [
                                { tag: 'text', text: `❌ 部署失败！` },
                                { tag: 'at', text: 'all' }
                            ],
                            [
                                { tag: 'text', text: `\n📦 项目: ` },
                                { tag: 'text', text: `${project}` }
                            ],
                            [
                                { tag: 'text', text: `\n🌍 环境: ` },
                                { tag: 'text', text: `${environment}` }
                            ],
                            [
                                { tag: 'text', text: `\n⏱️ 耗时: ` },
                                { tag: 'text', text: `${duration ? Math.round(duration / 1000) : 'N/A'} 秒` }
                            ],
                            [
                                { tag: 'text', text: `\n❌ 错误信息: ` },
                                { tag: 'text', text: error || '未知错误' }
                            ],
                            [
                                { tag: 'text', text: `\n⏰ 失败时间: ${timestamp}` }
                            ]
                        ]
                    }
                }
            }
        };
    }

    // 默认消息
    return {
        msg_type: 'text',
        content: {
            text: `${statusEmoji[status]} ${project} ${statusText[status]}`
        }
    };
}

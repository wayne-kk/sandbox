import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

export interface UserSession {
    userId: string;
    sessionId: string;
    createdAt: Date;
    lastActiveAt: Date;
    userAgent?: string;
    ipAddress?: string;
}

export class UserSessionManager {
    private static sessions: Map<string, UserSession> = new Map();
    private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24小时

    /**
     * 获取或创建用户会话
     */
    static async getOrCreateSession(request: NextRequest): Promise<UserSession> {
        const sessionId = this.getSessionIdFromRequest(request);

        if (sessionId) {
            const existingSession = this.sessions.get(sessionId);
            if (existingSession && this.isSessionValid(existingSession)) {
                // 更新最后活跃时间
                existingSession.lastActiveAt = new Date();
                return existingSession;
            }
        }

        // 创建新会话
        return this.createNewSession(request);
    }

    /**
     * 创建新用户会话
     */
    private static createNewSession(request: NextRequest): UserSession {
        const sessionId = crypto.randomUUID();
        const userId = this.generateUserId();

        const session: UserSession = {
            userId,
            sessionId,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: this.getClientIP(request)
        };

        this.sessions.set(sessionId, session);

        console.log(`🆕 创建新用户会话: ${userId} (${sessionId})`);

        return session;
    }

    /**
     * 从请求中获取会话ID
     */
    private static getSessionIdFromRequest(request: NextRequest): string | null {
        // 从 Cookie 中获取
        const sessionCookie = request.cookies.get('session-id');
        if (sessionCookie) {
            return sessionCookie.value;
        }

        // 从 Header 中获取
        const sessionHeader = request.headers.get('x-session-id');
        if (sessionHeader) {
            return sessionHeader;
        }

        return null;
    }

    /**
     * 检查会话是否有效
     */
    private static isSessionValid(session: UserSession): boolean {
        const now = new Date();
        const sessionAge = now.getTime() - session.createdAt.getTime();
        return sessionAge < this.SESSION_DURATION;
    }

    /**
     * 生成用户ID
     */
    private static generateUserId(): string {
        // 生成友好的用户ID，例如: user-abc123
        const randomPart = crypto.randomBytes(3).toString('hex');
        return `user-${randomPart}`;
    }

    /**
     * 获取客户端IP地址
     */
    private static getClientIP(request: NextRequest): string {
        // 尝试从各种头部获取真实IP
        const forwarded = request.headers.get('x-forwarded-for');
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }

        const realIP = request.headers.get('x-real-ip');
        if (realIP) {
            return realIP;
        }

        const remoteAddr = request.headers.get('x-remote-addr');
        if (remoteAddr) {
            return remoteAddr;
        }

        return 'unknown';
    }

    /**
     * 获取所有活跃会话
     */
    static getActiveSessions(): UserSession[] {
        const now = new Date();
        const activeSessions: UserSession[] = [];

        for (const session of this.sessions.values()) {
            if (this.isSessionValid(session)) {
                activeSessions.push(session);
            }
        }

        return activeSessions;
    }

    /**
     * 清理过期会话
     */
    static cleanupExpiredSessions(): number {
        const now = new Date();
        let cleanedCount = 0;

        for (const [sessionId, session] of this.sessions.entries()) {
            if (!this.isSessionValid(session)) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 清理了 ${cleanedCount} 个过期会话`);
        }

        return cleanedCount;
    }

    /**
     * 获取会话统计信息
     */
    static getSessionStats(): {
        totalSessions: number;
        activeSessions: number;
        uniqueIPs: number;
        sessionsByHour: { [hour: string]: number };
    } {
        const activeSessions = this.getActiveSessions();
        const uniqueIPs = new Set(activeSessions.map(s => s.ipAddress)).size;

        // 按小时统计会话创建数
        const sessionsByHour: { [hour: string]: number } = {};
        const now = new Date();

        for (let i = 0; i < 24; i++) {
            const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourKey = hour.getHours().toString().padStart(2, '0');
            sessionsByHour[hourKey] = 0;
        }

        for (const session of activeSessions) {
            const hour = session.createdAt.getHours().toString().padStart(2, '0');
            if (sessionsByHour[hour] !== undefined) {
                sessionsByHour[hour]++;
            }
        }

        return {
            totalSessions: this.sessions.size,
            activeSessions: activeSessions.length,
            uniqueIPs,
            sessionsByHour
        };
    }

    /**
     * 启动定时清理任务
     */
    static startCleanupScheduler(): void {
        // 每小时清理一次过期会话
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60 * 60 * 1000);

        console.log('🕒 会话清理调度器已启动');
    }
}

// 在应用启动时启动清理调度器
if (typeof window === 'undefined') {
    UserSessionManager.startCleanupScheduler();
} 
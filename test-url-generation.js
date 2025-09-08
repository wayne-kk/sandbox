// 测试URL生成函数
const { getSandboxUrl, getServerHost } = require('./src/lib/constants/ports.ts');

console.log('=== URL生成测试 ===');

// 模拟服务器环境
process.env.SERVER_HOST = '115.190.100.24';
process.env.NEXT_PUBLIC_SERVER_HOST = '115.190.100.24';

console.log('服务器环境:');
console.log('SERVER_HOST:', process.env.SERVER_HOST);
console.log('getServerHost():', getServerHost());
console.log('getSandboxUrl():', getSandboxUrl());
console.log('getSandboxUrl(3101):', getSandboxUrl(3101));

// 模拟客户端环境
global.window = {
    location: {
        protocol: 'http:',
        host: '115.190.100.24:8080'
    }
};

console.log('\n客户端环境:');
console.log('window.location.host:', global.window.location.host);
console.log('getSandboxUrl():', getSandboxUrl());
console.log('getSandboxUrl(3101):', getSandboxUrl(3101));

#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// 测试官方 MCP filesystem 服务器的功能
const filesystemTests = [
  {
    name: '列出目录内容',
    method: 'POST',
    path: '/api/call',
    body: {
      serverId: 'filesystem',
      toolName: 'list_directory',
      arguments: {
        path: '.'
      },
      requestId: 'fs_test_001'
    },
    expectedStatus: 200
  },
  {
    name: '读取文件内容',
    method: 'POST',
    path: '/api/call',
    body: {
      serverId: 'filesystem',
      toolName: 'read_file',
      arguments: {
        path: 'README.md',
        head: 10
      },
      requestId: 'fs_test_002'
    },
    expectedStatus: 200
  },
  {
    name: '搜索文件',
    method: 'POST',
    path: '/api/call',
    body: {
      serverId: 'filesystem',
      toolName: 'search_files',
      arguments: {
        path: '.',
        pattern: 'README'
      },
      requestId: 'fs_test_003'
    },
    expectedStatus: 200
  },
  {
    name: '获取允许的目录',
    method: 'POST',
    path: '/api/call',
    body: {
      serverId: 'filesystem',
      toolName: 'list_allowed_directories',
      arguments: {},
      requestId: 'fs_test_004'
    },
    expectedStatus: 200
  }
];

// 通用 HTTP 请求函数
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await makeRequest('GET', '/api/health');
    if (response.status === 200) {
      console.log('✅ MCP HTTP 代理服务器正在运行');
      return true;
    }
  } catch (error) {
    console.log('❌ MCP HTTP 代理服务器未运行');
    console.log('请先运行: npm start');
    return false;
  }
}

// 运行 filesystem 测试
async function runFilesystemTests() {
  console.log('\n🧪 开始测试官方 MCP Filesystem 服务器...\n');
  
  let passed = 0;
  let failed = 0;

  for (const test of filesystemTests) {
    try {
      console.log(`📋 测试: ${test.name}`);
      
      const response = await makeRequest(test.method, test.path, test.body);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ 通过 - 状态码: ${response.status}`);
        if (response.data.success) {
          console.log(`   📄 响应: ${JSON.stringify(response.data.data || response.data, null, 2).substring(0, 200)}...`);
        } else {
          console.log(`   ⚠️  错误: ${response.data.error}`);
        }
        passed++;
      } else {
        console.log(`❌ 失败 - 期望状态码: ${test.expectedStatus}, 实际: ${response.status}`);
        console.log(`   📄 响应: ${JSON.stringify(response.data, null, 2)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  return { passed, failed };
}

// 检查 filesystem 服务器状态
async function checkFilesystemServer() {
  try {
    console.log('🔍 检查 filesystem 服务器状态...');
    const response = await makeRequest('GET', '/api/servers/filesystem');
    
    if (response.status === 200) {
      const server = response.data;
      console.log(`✅ Filesystem 服务器状态: ${server.status}`);
      console.log(`   📝 名称: ${server.name}`);
      console.log(`   🛠️  工具数量: ${server.tools.length}`);
      
      if (server.tools.length > 0) {
        console.log('   📋 可用工具:');
        server.tools.forEach(tool => {
          console.log(`      - ${tool.name}: ${tool.description.substring(0, 50)}...`);
        });
      }
    } else {
      console.log('❌ 无法获取 filesystem 服务器状态');
    }
  } catch (error) {
    console.log(`❌ 检查服务器状态时出错: ${error.message}`);
  }
}

// 主函数
async function main() {
  console.log('🚀 MCP Filesystem 服务器测试工具\n');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await checkFilesystemServer();
  console.log('');
  
  const results = await runFilesystemTests();
  
  console.log('\n🎯 测试完成!');
  if (results.failed === 0) {
    console.log('🎉 所有测试都通过了！Filesystem 服务器集成成功。');
  } else {
    console.log('⚠️  部分测试失败，请检查配置和服务器状态。');
  }
}

// 运行测试
main().catch(console.error); 
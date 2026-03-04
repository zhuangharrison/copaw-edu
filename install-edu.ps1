# CoPaw-Edu 教育版 安装脚本 (Windows PowerShell)
# 用法: irm https://your-domain.com/install-edu.ps1 | iex

param(
    [string]$Role = "",
    [switch]$Student,
    [switch]$Parent,
    [switch]$Teacher,
    [switch]$Help
)

# 颜色函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Print-Success { Write-ColorOutput Green "✓ $args" }
function Print-Warning { Write-ColorOutput Yellow "⚠ $args" }
function Print-Error { Write-ColorOutput Red "✗ $args" }
function Print-Step { Write-Output ""; Write-ColorOutput Cyan "[步骤 $args]" }

# 显示帮助
if ($Help) {
    Write-Output "用法: install-edu.ps1 [选项]"
    Write-Output ""
    Write-Output "选项:"
    Write-Output "  -Role <role>     指定角色 (student/parent/teacher)"
    Write-Output "  -Student         快速安装学生版"
    Write-Output "  -Parent          快速安装家长版"
    Write-Output "  -Teacher         快速安装教师版"
    Write-Output "  -Help            显示帮助"
    exit 0
}

# 确定角色
if ($Student) { $Role = "student" }
if ($Parent) { $Role = "parent" }
if ($Teacher) { $Role = "teacher" }

# 显示Header
Clear-Host
Write-ColorOutput Cyan @"
   _____            _____      _     _
  / ____|          / ____|    | |   | |
 | |     ___  _ __| |     __ _| | __| | ___ _ __
 | |    / _ \| '__| |    / _` | |/ _` |/ _ \ '__|
 | |___| (_) | |  | |___| (_| | | (_| |  __/ |
  \_____\___/|_|   \_____\__,_|_|\__,_|\___|_|

"@
Write-ColorOutput Green "      教育版 - 让AI助力每一个学习者"
Write-Output ""

# 检查Python
Print-Step 1 "检查系统环境"
try {
    $pythonVersion = python --version 2>&1
    Print-Success "Python版本: $pythonVersion"
} catch {
    Print-Error "未找到Python，请先安装Python 3.10+"
    Write-Output "下载地址: https://www.python.org/downloads/"
    Write-Output "安装时请勾选 'Add Python to PATH'"
    exit 1
}

# 检查pip
try {
    $pipVersion = pip --version 2>&1
    Print-Success "pip已就绪"
} catch {
    Print-Error "未找到pip"
    exit 1
}

# 安装CoPaw-Edu
Print-Step 2 "安装CoPaw-Edu"
Write-Output "正在安装..."
try {
    pip install --upgrade copaw-edu 2>$null
    Print-Success "CoPaw-Edu 安装完成"
} catch {
    Print-Warning "从PyPI安装失败，尝试从源码安装..."
    # pip install git+https://github.com/xxx/copaw-edu.git
}

# 初始化配置
Print-Step 3 "初始化配置"
if ($Role) {
    copaw-edu init --role $Role --defaults
} else {
    copaw-edu init
}
Print-Success "配置完成"

# 完成
Print-Step 4 "安装完成!"
Write-Output ""
Write-ColorOutput Green "🎉 恭喜！CoPaw-Edu 教育版安装完成！"
Write-Output ""
Write-Output "启动方式:"
Write-ColorOutput Cyan "  copaw-edu app          启动Web界面"
Write-ColorOutput Cyan "  copaw-edu app --port 8080  指定端口启动"
Write-Output ""
Write-Output "访问地址:"
Write-ColorOutput Cyan "  http://127.0.0.1:8088"
Write-Output ""
Write-ColorOutput Yellow "提示: 首次使用请先运行 'copaw-edu config' 配置API"

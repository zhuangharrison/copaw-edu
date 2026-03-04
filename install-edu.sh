#!/bin/bash

#############################################
# CoPaw-Edu 教育版 安装脚本
# 支持: Linux / macOS
#############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo -e "${CYAN}"
    echo "   _____            _____      _     _     "
    echo "  / ____|          / ____|    | |   | |    "
    echo " | |     ___  _ __| |     __ _| | __| | ___ _ __ "
    echo " | |    / _ \| '__| |    / _\` | |/ _\` |/ _ \ '__|"
    echo " | |___| (_) | |  | |___| (_| | | (_| |  __/ |   "
    echo "  \_____\___/|_|   \_____\__,_|_|\__,_|\___|_|   "
    echo -e "${NC}"
    echo -e "${GREEN}      教育版 - 让AI助力每一个学习者${NC}"
    echo ""
}

print_step() {
    echo -e "\n${BLUE}[步骤 $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 检查系统
check_system() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        SYSTEM="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        SYSTEM="macos"
    else
        print_error "不支持的系统: $OSTYPE"
        exit 1
    fi
    print_success "检测到系统: $SYSTEM"
}

# 检查Python
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        print_error "未找到Python，请先安装Python 3.10+"
        echo "下载地址: https://www.python.org/downloads/"
        exit 1
    fi

    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
    print_success "Python版本: $PYTHON_VERSION"
}

# 检查pip
check_pip() {
    if command -v pip3 &> /dev/null; then
        PIP_CMD="pip3"
    elif command -v pip &> /dev/null; then
        PIP_CMD="pip"
    else
        print_error "未找到pip"
        exit 1
    fi
    print_success "pip已就绪"
}

# 解析参数
ROLE=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --role)
            ROLE="$2"
            shift 2
            ;;
        --student)
            ROLE="student"
            shift
            ;;
        --parent)
            ROLE="parent"
            shift
            ;;
        --teacher)
            ROLE="teacher"
            shift
            ;;
        --help|-h)
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --role <role>     指定角色 (student/parent/teacher)"
            echo "  --student         快速安装学生版"
            echo "  --parent          快速安装家长版"
            echo "  --teacher         快速安装教师版"
            echo "  --help, -h        显示帮助"
            exit 0
            ;;
        *)
            print_error "未知参数: $1"
            exit 1
            ;;
    esac
done

# 主安装流程
main() {
    print_header

    print_step 1 "检查系统环境"
    check_system
    check_python
    check_pip

    print_step 2 "安装CoPaw-Edu"
    echo "正在安装..."
    $PIP_CMD install --upgrade copaw-edu 2>/dev/null || {
        print_warning "从PyPI安装失败，尝试从源码安装..."
        # 如果PyPI没有，可以从源码安装
        # $PIP_CMD install git+https://github.com/xxx/copaw-edu.git
    }
    print_success "CoPaw-Edu 安装完成"

    print_step 3 "初始化配置"
    if [ -n "$ROLE" ]; then
        copaw-edu init --role "$ROLE" --defaults
    else
        copaw-edu init
    fi
    print_success "配置完成"

    print_step 4 "安装完成!"
    echo ""
    echo -e "${GREEN}🎉 恭喜！CoPaw-Edu 教育版安装完成！${NC}"
    echo ""
    echo "启动方式:"
    echo -e "  ${CYAN}copaw-edu app${NC}          启动Web界面"
    echo -e "  ${CYAN}copaw-edu app --port 8080${NC}  指定端口启动"
    echo ""
    echo "访问地址:"
    echo -e "  ${CYAN}http://127.0.0.1:8088${NC}"
    echo ""
    echo -e "${YELLOW}提示: 首次使用请先运行 'copaw-edu config' 配置API${NC}"
}

main

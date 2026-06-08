const cards = []

function c(k, f, b) {
  cards.push({ subject:'network', knowledgePoint:k, front:f, back:b, masteryLevel:0, nextReviewAt:'2026-05-26', reviewCount:0 })
}

c('以太网帧前导码', '以太网帧前同步码(Preamble)和SFD字段的作用？', '前导码7B(10101010...交替)使接收端时钟同步。SFD(帧首定界符)1B=10101011(最后2位11指示帧开始)。前导码和SFD不作为帧长度(不计入MTU或FCS)。100M/1000M以太网继续沿用此格式(不变)。')
c('以太网物理层标准', '10BASE-T,100BASE-TX,1000BASE-T的编码方式？', '10BASE-T:曼彻斯特编码(波特率20MBd,提供时钟)。100BASE-TX:4B/5B(80%效率)+MLT-3三层编码(125MBd)。1000BASE-T:4对线全双工+5级脉冲幅度调制PAM-5(125MBd每对线达成1000Mbps)。10GBASE-T用更先进编码。')
c('VLAN标签帧格式', '802.1Q VLAN标签插入到以太帧的哪个位置？数据变化？', '在源MAC地址和类型/长度字段之间插入4字节标签。TPID=0x8100(标记此帧为802.1Q)；TCI=优先级(3bit)+CFI(1bit)+VLAN ID(12bit可达4094个VLAN)。插入标签后帧总长+4B，可能超过1518B普通帧长(改允许1522B)。')
c('ADSL和光纤接入', 'ADSL非对称数字用户线路的频率划分和调制？', '用普通电话线(铜缆双绞线)但高于话音频率的频带。频率划分:0-4kHz=电话,25-138kHz=上行,138kHz-1.1MHz=下行。DMT(离散多音调)调制分割多个子信道(QAM调变)。非对称:下行>上行(符合用户下载多于上传特征)。')
c('异构网络互连的IP隧道', 'IP隧道(Tunneling)如何在IPv6过渡中使用？', 'IPv6数据报封装在IPv4数据报中：IPv4头(协议=41=IPv6-over-IPv4)→IPv6头+数据。IPv6两端双栈的路由器/主机解封装还原IPv6。类似的还有6to4隧道、ISATAP、Teredo。核心思想：将新协议报文打包在现有协议上传输。')
c('移动IP', '移动IP的基本原理？家乡代理和外部代理的作用？', '移动节点在外部网络获得转交地址COA→向家乡代理HA注册此COA。发往移动节点原IP的数据报被HA截获→用IP-in-IP隧道封装后转发到COA→移动节点解封装接收。返回的话移动节点直接用COA作为源地址和通信对方通信(三角路由)。')
c('可靠传输的确认机制', '累积确认和选择确认(SACK)的区别？', '累积确认：确认号指示该序号前的所有数据均已收到(若丢失后面数据也只能重复确认相同序号)。选择确认SACK(TCP option)：可告知对方已成功接收的不连续段(如收到100-200+300-400，可确认300-400)，使发送端只需重传丢失的部分段，提高效率。')
c('TCP的定时器', 'TCP中四种定时器的作用？', '重传定时器(RTO超时重传)。坚持定时器(Persist timer，防止接收端窗口通告丢失导致死锁，定时探测窗口大小)。保活定时器(Keep-alive，检测对方是否已崩溃→超时关闭连接)。TIME_WAIT定时器(2MSL超时后，关闭连接并释资源)。')
c('TCP连接同时打开', 'TCP同时打开(Simultaneous Open)的过程？', '双方同时发送SYN(而非一方主动一方被动)。状态转换：CLOSED→SYN-SENT(发SYN)→收到对方SYN→发SYN+ACK→双方进SYN-RCVD→交换ACK→ESTABLISHED。同时打开仅需一次的SYN+ACK交换，之后各自确认。')
c('WebSocket', 'WebSocket与HTTP的区别和升级过程？', 'WebSocket是全双工持久连接协议(基于TCP)。握手：客户端发Upgrade:websocket+Sec-WebSocket-Key→服务器回应101 Switching Protocols+Sec-WebSocket-Accept。连接升级成功后双方可以随时发送数据帧(非请求-响应模式)，低开销实时通信(在线游戏/聊天/chart行情推送)。')
c('SSL/TLS握手', 'TLS握手的过程(简化)？', '1.ClientHello(随机数+加密套件) 2.ServerHello(随机数+选中的加密套件)+证书+ServerHelloDone 3.ClientKeyExchange(预主密+公钥加密/使用RSA/DH)+ChangeCipherSpec+Finished 4.Server:ChangeCipherSpec+Finished。握手完成后双方共享会话密钥用于对称加密通信。')
c('QUIC协议', 'QUIC协议基于UDP相比TCP有什么优势？', 'QUIC(Google设计的HTTP/3基础)：1. 0-RTT/1-RTT握手(断开连接后快速恢复) 2.改进的拥塞控制(每个流独立无队头阻塞) 3.前向纠错(减少重传) 4.连接迁移(IP变化如WiFi→4G时可无缝迁移Connection ID不变)。除HTTP/3外也用于流媒体。')

export default cards

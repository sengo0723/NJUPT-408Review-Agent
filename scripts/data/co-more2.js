const cards = []

function c(k, f, b) {
  cards.push({ subject:'computer-organization', knowledgePoint:k, front:f, back:b, masteryLevel:0, nextReviewAt:'2026-05-26', reviewCount:0 })
}

c('内存交错存储', '什么是多体交叉存储器？低位交叉和高位交叉？', '多体交叉：将连续地址分配在不同存储体(bank)，使连续访问可在不同体间流水重叠。低位交叉编址(低位选体高位体内) 可流水化连续访存，高位交叉反之。现代SDRAM用多bank实现，CPU超标量一次可访问多体。')
c('Cache的预取技术', 'Cache预取(Prefetch)的方式和效果？', '硬件预取：检测顺序访问模式(如连续load指令)自动预取后续块到Cache+预取缓冲器。软件预取：编译器在load之前插入prefetch指令拉入Cache。减少强制缺失但可能污染Cache (多余预取)且增加带宽开销。')
c('victim cache', '受害缓存(Victim Cache)的作用？', 'Cache替换被逐出的块暂存在小容量的全相联Victim Cache中。缺失时先查Victim Cache→命中则补回Cache+交换。减少直接映射的冲突缺失，作为主Cache的后备。4-8条目即可减少约20%的冲突缺失。')
c('Trace Cache', '追踪缓存(Trace Cache)的原理？', '存储已经译码的动态码指令序列(非按照取指地址存放，而是按照程序实际执行的顺序和已译码的微操作)。Pentium 4用Trace Cache存储μOP，跳过x86复杂指令译码提升流水线吞吐。')
c('分支预测精度', '2位分支预测器和Gshare/Tournament预测器？', '2位预测器(00强不跳/01弱不跳/10弱跳/11强跳) 每次准确则往强方向移。Gshare：全局历史+PC哈希索引模式表(PT)捕捉特定程序的分支配对模式。锦标赛预测器(Tournament)：两预测器(局部+全局)竞争选出最好的，Alpha和现代x86常用。')
c('精确异常与重启', '流水线怎样实现精确异常(Precise Exception)？', '故障指令更新完所有流水段后才处理异常。延迟处理：故障时阻止后续指令提交，等前序所有指令都完成→保存精确状态(PC→EPC)→跳转到异常处理→处理完可精确重启。用重排缓冲(ROB)协调指令按序提交。')
c('Tomasulo算法核心', 'Tomasulo算法如何解决WAR和WAW冒险？', '通过保留站(Reservation Station)打乱执行顺序，用寄存器重命名(物理寄存器替换逻辑寄存器)消除WAR/WAW伪相关。CDB(通用数据总线)广播结果→等该结果的保留站接收。允许乱序执行+精确中断→现代CPU基础。')
c('寄存器重命名原理', '为什么寄存器重命名能消除假数据相关？', '每个写操作分配一个新物理寄存器(或ROB项号)，读操作从最近一个"写同逻辑寄存器"的物理寄存器读取。消除WAR(读后写→读的是旧物理寄存器的值)和WAW(两写分配不同物理寄存器，后者覆盖前者)。暴露真实的数据流依赖RAW。')
c('MOESI协议', 'MOESI相比MESI多了O状态(Owned)的意义？', 'O状态=Cache行被修改过且可能被其他cache共享(Shared但dirty)。其他缓存有S(clean copy)副本且以O副本为最新值。M/O差别：O允许共享而M独占(Modified Exclusive)。当其他cache要读脏行时O→转发数据避免写回主存。AMD Opteron用MOESI。')
c('非临时指令', '非临时(Streaming)Store指令的作用？', '告诉CPU不要将数据加载到Cache(直接经写缓冲写回主存)，避免污染Cache(数据只会用一次→不存cache)。适用：大量数据移动/初始化而不立即再用(Memcpy/ memset)。x86:MOVNTI/MOVNTQ/MOVNTPS，ARM:STNP。')
c('时钟域交叉', 'CPU和慢速外设之间如何进行跨时钟域数据交换？', '使用异步FIFO(双端口存储器)：写端用CPU时钟写入；读端用外设时钟读出。空/满标志根据格雷码指针判断。或在同步接口中用同步器(2级FF)防止亚稳态。PCIe也是多lane串行取消公共时钟源(嵌入式Clock)。')
c('错误检测与纠正', '服务器内存为何用ECC(错误纠正码)？', 'ECC用额外的位(如8位检测64位)可纠正1位错误检测2位错误(SECDED/汉明码)。宇宙射线→DRAM单元翻转(软错误)→ECC可使系统继续运行而不崩溃。非ECC不可纠错→可能导致数据损坏/系统崩溃。')

export default cards

import fs from 'fs'
import path from 'path'
import osCards from './data/os-data.js'
import cnCards from './data/cn-data.js'
import dsExtraCards from './data/ds-extra.js'
import coExtraCards from './data/co-extra.js'
import dsMoreCards from './data/ds-more.js'
import coMoreCards from './data/co-more.js'
import osMoreCards from './data/os-more.js'
import cnMoreCards from './data/cn-more.js'
import dsMore2Cards from './data/ds-more2.js'
import coMore2Cards from './data/co-more2.js'
import osMore2Cards from './data/os-more2.js'
import cnMore2Cards from './data/cn-more2.js'

const today = '2026-05-26'

function card(subject, knowledgePoint, front, back) {
  return { subject, knowledgePoint, front, back, masteryLevel: 0, nextReviewAt: today, reviewCount: 0 }
}

const cards = []

// ==================== 数据结构 (约200张) ====================

// 线性表
cards.push(card('data-structure', '算法复杂度分析', '时间复杂度和空间复杂度的定义？常见复杂度排序？', '时间复杂度T(n)=O(f(n))衡量算法执行时间增长量级。常见递增：O(1)<O(logn)<O(n)<O(nlogn)<O(n²)<O(n³)<O(2ⁿ)<O(n!)。空间复杂度衡量额外辅助空间消耗。'))
cards.push(card('data-structure', '顺序表插入删除', '顺序表插入/删除的时间复杂度和平均移动元素数？', '插入：最好O(1)尾部，最坏O(n)头部，平均移n/2个元素。在第i位插入移n-i+1个。删除同理。插入合法性：1≤i≤n+1。'))
cards.push(card('data-structure', '顺序与链式比较', '顺序存储和链式存储的优缺点？', '顺序：随机访问O(1)，存储密度=1，插入删除O(n)需移元素。链式：插入删除O(1)(已知前驱)，动态分配，不支持随机访问O(n)，密度<1。'))
cards.push(card('data-structure', '单链表头插尾插', '单链表头插法和尾插法的区别？', '头插：新节点插入头部，逆序输出(栈)。尾插：插入尾部，顺序输出。头插O(1)仅改head；尾插需遍历O(n)或维护尾指针O(1)。'))
cards.push(card('data-structure', '双链表', '双向链表相比单链表的优势？删除已知节点的复杂度？', '优势：双向遍历；删除已知节点O(1)(不需找前驱)；前驱可达。代价：多一个prior指针域。'))
cards.push(card('data-structure', '循环链表', '循环单链表和双链表的判空条件？', '循环单链表带空头结点：L->next==L。循环双链表：L->next==L且L->prior==L。可从任意节点遍历全链表。'))
cards.push(card('data-structure', '静态链表', '静态链表的特点和典型应用？', '用数组下标模拟指针，next=-1为空。不需动态分配，适用于无指针语言。典型应用：OS的FAT文件分配表。'))
cards.push(card('data-structure', '顺序表扩容', '顺序表动态扩容的时间和空间分析？', '双倍增容法：每次扩容×2。n次push_back总时间O(n)（均摊O(1)）。扩容n次时累计移动次数1+2+4+...+≈O(n)。若倍增因子为k，均摊仍O(1)。'))
cards.push(card('data-structure', '有序表合并', '两个递增有序单链表合并为一个递减有序单链表的算法思路？', '头插法：同时遍历两链表，比较当前节点值，将较小者用头插法插入新链表。因为是头插法，原递增序列变为递减。时间O(m+n)，空间O(1)。'))

// 栈
cards.push(card('data-structure', '栈的基本概念', '栈的特点？上溢和下溢的含义？', '栈是LIFO线性表。操作：push、pop、top。上溢：栈满时入栈。下溢：栈空时出栈。顺序栈需预设大小。'))
cards.push(card('data-structure', '栈应用-括号匹配', '栈在括号匹配中的算法步骤？时间/空间复杂度？', '左括号入栈，右括号出栈匹配。最后栈空则全匹配。时间O(n)，空间O(n)。注意判断栈空（防右括号多时下溢）。'))
cards.push(card('data-structure', '栈应用-表达式求值', '中缀转后缀表达式的算法步骤？', '操作数直接输出。运算符：优先级>栈顶则入栈，否则栈顶出栈输出。左括号入栈，遇右括号出栈直到左括号。结束弹出全部。'))
cards.push(card('data-structure', '栈应用-递归转非递归', '递归为什么可用栈消除？一般转换方法？', '递归本质是系统栈保存现场。转非递归：1.尾递归→循环。2.一般递归→自定义栈模拟系统栈保存参数和返回地址。后序遍历最复杂需标记位。'))
cards.push(card('data-structure', '卡特兰数-出栈序列', 'n个不同元素依次入栈的合法出栈序列数？公式和约束？', '卡特兰数Cₙ=1/(n+1)C(2n,n)。n=3有5种，n=4有14种。约束：任意时刻出栈数≤入栈数。对应2n位二进制串，前缀0数≥1数。'))
cards.push(card('data-structure', '出栈序列合法性判断', '给定入栈顺序1,2,...,n和出栈序列，如何判断是否合法？', '模拟法：依次处理出栈序列元素，若栈顶不是当前出栈元素则继续入栈直到匹配或全部入栈。若能完整出栈序列则合法。时间O(n)。'))
cards.push(card('data-structure', '共享栈', '两栈共享空间的实现原理？判空和判满条件？', '两栈栈底在数组两端，栈顶向中间生长。top1=-1空，top2=n空。满：top1+1==top2。适合两栈空间需求此消彼长的场景。'))

// 队列
cards.push(card('data-structure', '队列基本概念', '队列特点？双端队列的四种操作？', 'FIFO线性表。双端队列：头入、头出、尾入、尾出。输入受限：一端只能出。输出受限：一端只能入。栈和普通队列为其特例。'))
cards.push(card('data-structure', '循环队列公式', '循环队列的队空/队满/元素个数公式？', '队空：front==rear。队满：(rear+1)%MaxSize==front（牺牲一单元）。个数：(rear-front+MaxSize)%MaxSize。也可用tag标记区分空满。'))
cards.push(card('data-structure', '队列应用场景', '队列在计算机中的典型应用？', '1.打印任务队列 2.CPU就绪队列(RR) 3.BFS图遍历 4.二叉树层序遍历 5.消息队列(生产者-消费者) 6.磁盘I/O请求队列。'))
cards.push(card('data-structure', '链栈与链队列', '链栈和链队列分别在链表哪端操作？为什么？', '链栈：表头操作O(1)。链队列：入队尾插O(1)，出队头删O(1)，需头尾指针。若反：尾删O(n)找前驱。'))

// 串
cards.push(card('data-structure', '串的存储', '串的顺序、堆分配、块链存储各自特点？', '顺序：定长数组，可能截断。堆分配：动态malloc，长度可变。块链：链表每节点多字符，存储密度=字符数/节点大小，密度高操作复杂。'))
cards.push(card('data-structure', 'BF与KMP比较', 'BF和KMP主串指针区别？最坏比较次数？', 'BF：主串i和j都回溯(i=i-j+2)，最坏O(mn)。KMP：i不回溯仅j回溯到next[j]，最坏约2n+m次比较，O(m+n)。实际场景中BF在自然语言串匹配中效率不差。'))

// KMP
cards.push(card('data-structure', 'KMP-next数组', 'KMP中next[j]的含义？求法？时间复杂度？', 'next[j]=前j个字符的最长相等前后缀长度+1(模式串从1编号)。双指针法求：i=1,j=0,匹配同增，失配j=next[j]。时间O(m)。'))
cards.push(card('data-structure', 'KMP-nextval优化', 'KMP的nextval数组如何优化？何时用？', '若p[j]==p[next[j]]，则nextval[j]=nextval[next[j]]（因为p[j]失配时p[next[j]]也必然失配），否则nextval[j]=next[j]。减少冗余比较。'))
cards.push(card('data-structure', 'KMP匹配过程', 'KMP匹配时主串指针如何处理？总复杂度？', '主串指针i不回溯！仅j回溯到next[j]。总O(m+n)，优于朴素O(mn)。这是KMP核心优势。'))

// 数组与矩阵
cards.push(card('data-structure', '二维数组地址计算', '按行优先和列优先的二维数组元素地址公式？', '行优先：LOC=a₀+(i×n+j)×L，n列数。列优先：LOC=a₀+(j×m+i)×L，m行数。n维推广：LOC=A₀+(Σ维度累积乘积)×L。C行优先，Fortran列优先。'))
cards.push(card('data-structure', '对称矩阵压缩', '对称矩阵和下三角矩阵的压缩存储公式？', '对称矩阵存下三角(含对角线)：n(n+1)/2元素。aᵢⱼ(i≥j)→B[(i-1)i/2+(j-1)]。上三角转储下三角：交换行列。'))
cards.push(card('data-structure', '三对角矩阵', '三对角矩阵的压缩存储和地址公式？', '仅三条对角线有非零元。存于B[3n-2]。aᵢⱼ→B[2i+j-3]（|i-j|≤1时）。已知B[k]求(i,j)：i=⌊(k+1)/3⌋+1, j=k-2i+3。'))
cards.push(card('data-structure', '稀疏矩阵存储', '稀疏矩阵的三元组表和十字链表存储方式？', '三元组：(行,列,值)数组，便于转置（快速转置法O(n+t)）。十字链表：行指针数组+列指针数组，节点含(行,列,值,下,右)，适合频繁增删。'))
cards.push(card('data-structure', '广义表', '广义表长度和深度的定义？表头与表尾的区别？', '长度：顶层元素个数。深度：括号嵌套最大层数。表头=首元素(原子或子表)。表尾=去首后剩余元素组成的表(必为表)。()长度0深度1。'))

// 树
cards.push(card('data-structure', '二叉树定义', '二叉树与度为2的树的区别？满二叉树和完全二叉树的定义？', '二叉树：最多2子树，有左右之分。度为2的树：至少3节点，无序。满二叉树：深度k有2ᵏ-1节点。完全二叉树：与满二叉树编号对应，末层可不满但靠左。'))
cards.push(card('data-structure', '二叉树5个性质', '二叉树的5个重要性质？', '1.第i层最多2^(i-1)节点 2.k层最多2ᵏ-1节点 3.n₀=n₂+1 4.完全二叉树深度⌊log₂n⌋+1 5.n节点二叉链表有n+1空链域。推导：n=n₀+n₁+n₂，B=n-1=n₁+2n₂→n₀=n₂+1。'))
cards.push(card('data-structure', '完全二叉树编号', '完全二叉树按层编号(从1起)，父节点与子节点编号关系？', '节点i：左孩子2i，右孩子2i+1，父⌊i/2⌋。偶数→左孩子，奇数→右孩子。叶子范围⌊n/2⌋+1~n。深度⌊log₂i⌋+1。'))
cards.push(card('data-structure', '二叉树空链域', 'n节点二叉链表多少个空链域？三叉链表多了什么？', '二叉链表：2n指针域，n-1边→空链域=n+1。三叉链表加parent指针→总3n指针域。n+1空链域可造线索二叉树实现非递归遍历。'))
cards.push(card('data-structure', '先序遍历非递归', '二叉树先序遍历非递归算法步骤？', '1.根入栈 2.出栈访问 3.右子入栈(如有) 4.左子入栈(如有) 5.重复2-4到栈空。先入栈右子再左子，这样左子先出栈(先左后右)。'))
cards.push(card('data-structure', '中序遍历非递归', '二叉树中序遍历非递归算法步骤？', '1.根入栈 2.沿左链到底入栈 3.出栈访问 4.转向右子树(重复2-3)。栈空且当前NULL结束。O(n)时间O(h)空间。'))
cards.push(card('data-structure', '后序遍历非递归', '二叉树后序遍历为何最复杂？双栈法？', '访问根前需确保左右子已遍历需标记。双栈法：栈1先序入栈(改根左右为根右左得逆后序)→栈2收集，最后倒序出栈。或单栈+prev指针：prev记录上次访问节点。'))
cards.push(card('data-structure', '重建二叉树', '为何仅前序+后序不能唯一确定二叉树？哪种可以？', '前序(根左右)和后序(左右根)都不能区分左右子分界。仅中序提供左子在前右子在后的信息。中序+前序✅ 中序+后序✅ 前序+后序❌。BST仅用前序可唯一确定。'))
cards.push(card('data-structure', '线索二叉树', '中序线索二叉树如何找前驱和后继？', '后继：rtag=1右指针直指；rtag=0有右子→后继=右子树最左下。前驱：ltag=1直指；ltag=0有左子→前驱=左子树最右下。遍历每个节点O(1)找后继。'))
cards.push(card('data-structure', '树转二叉树', '树/森林转换为二叉树的规则？', '树→二叉树：左孩子右兄弟。兄弟连线，除首子外断父连线。森林→二叉树：每树先转二叉树，然后根节点互连(兄弟)。转换后若无右子树则为最后一棵树。'))
cards.push(card('data-structure', '孩子兄弟表示法', '树的孩子兄弟(左孩子右兄弟)表示法如何找第i个孩子？', '每个节点两个指针：firstChild(左)→nextSibling(右)。找第i个孩子：p=firstChild;循环i-1次p=p->nextSibling。遍历所有孩子沿nextSibling走到底。'))
cards.push(card('data-structure', '树遍历与二叉树遍历的关系', '树的先根/后根遍历对应其转换后二叉树的哪种遍历？', '树的先根遍历=转换后二叉树的先序遍历。树的后根遍历=转换后二叉树的中序遍历。森林的先序遍历=二叉树的先序，森林的中序=二叉树的中序。'))

// 哈夫曼树
cards.push(card('data-structure', '哈夫曼树构造', '哈夫曼树的构造过程和特点？', '每次选权值最小两个合并。n叶子→2n-1节点，无度1节点。WPL=Σ权值×路径长度最小。哈夫曼编码是前缀编码(左0右1)。'))
cards.push(card('data-structure', 'WPL计算', '如何不构造树就计算WPL？', '优先队列：每次取出最小两权值合并，WPL累加合并后权值，放回队列。最终累加和即为WPL。时间O(nlogn)。'))

// 并查集
cards.push(card('data-structure', '并查集结构与优化', '并查集的数据结构？Find/Union优化？', '森林双亲表示(数组)，parent=-1为根。优化1：按秩合并(小树→大树)。优化2：路径压缩(Find时路径节点直连根)。两优化均摊约O(α(n))≈常数。'))

// 二叉排序树
cards.push(card('data-structure', 'BST查找性能', '二叉排序树查找性能和删除操作？', '查找O(h)，最好O(logn)平衡，最坏O(n)单支。删除：叶直接删；单子→子代替；双子→用前驱/后继替换。BST不保证平衡。'))
cards.push(card('data-structure', 'BST的插入', 'BST插入新关键字的算法过程和复杂度？', '从根开始比较，小于走左子大于走右子，直到找到NULL位置插入为新叶子。时间O(h)。插入按照严格的小根大规则。'))

// AVL树
cards.push(card('data-structure', 'AVL四种旋转', 'AVL树的四种旋转和平衡因子？', 'LL：右单旋。RR：左单旋。LR：先左后右双旋。RL：先右后左双旋。平衡因子=左高-右高，|BF|≤1。插入后从插入点向上找首个|BF|=2节点旋转。'))
cards.push(card('data-structure', 'AVL删除调整', 'AVL树删除后如何调整？和插入调整有何不同？', '删除后可能一路向上都需调整(插入最多转一次)。删除节点→检查父节点平衡→调整旋转→可能父节点也失衡需继续向上。最坏O(logn)次旋转。'))
cards.push(card('data-structure', 'AVL最大最小节点数', '高度为h的AVL树最少/最多有多少节点？', '最多2^(h+1)-1(满)。最少nₕ=nₕ₋₁+nₕ₋₂+1(近似fibonacci)，n₀=1,n₁=2。以斐波那契因子增长，nₕ≈φ^(h+1)/√5-1，高度约1.44log₂(n+1)。'))

// 红黑树
cards.push(card('data-structure', '红黑树五条性质', '红黑树的五条性质？黑高定义？', '1.节点红或黑 2.根黑 3.NIL(叶子)黑 4.红节点父子必黑 5.任路径黑节点数相同。黑高bh=从该节点(不含自身)到叶的黑色节点数。最长路径≤2倍最短路径。'))
cards.push(card('data-structure', '红黑树vsAVL', '红黑树和AVL树各自适用场景？', 'AVL更严格(|BF|≤1)，查找更快但插入删除旋转多。红黑树最多2倍高度差，插入删除最多2次旋转，适用于写密集场景(STL map/set)。'))

// B树
cards.push(card('data-structure', 'B树定义', 'm阶B树的定义条件？', 'ceil(m/2)≤非根节点关键字数≤m-1。非叶节点子树数=关键字数+1。根节点至少2子(非叶时)。所有叶节点同层。高度h：n+1≥2×ceil(m/2)^(h-1)。'))
cards.push(card('data-structure', 'B树插入删除', 'B树插入和删除后的调整？', '插入：查找到叶后插。满则分裂(中关键字上升父节点)。删除：非叶→前驱/后继替→转叶删。叶删后少则借兄弟(>ceil(m/2)-1时)或合并兄弟+父关键字。'))
cards.push(card('data-structure', 'B树vsB+树', 'B树和B+树的区别？B+树优势？', 'B树：关键字在各层，查找可在内部节点结束。B+树：关键字仅叶节点，叶形成有序链表。B+优势：范围查询O(logn+m)，每节点关键字多I/O更优，适合数据库索引。'))

// 散列表
cards.push(card('data-structure', '散列函数构造', '散列函数构造方法有哪些？', '1.除留余数法(H(key)=key%p,p≤m素数) 2.直接定址 3.数字分析 4.平方取中 5.折叠。除留余数最常用，除数取不大于m的最大素数减少冲突。'))
cards.push(card('data-structure', '开放定址法对比', '线性探测、二次探测、双重散列的对比？', '线性：H+i，主聚集严重。二次：H+i²，减主聚集有二次聚集。双重：H₁+i×H₂，H₂与m互质，无聚集最佳。缺点：删除需做lazy deletion标记。'))
cards.push(card('data-structure', '散列表ASL', '散列表ASL成功和ASL失败的计算？装填因子α？', 'α=n/m。拉链：ASL成功≈1+α/2，失败≈α。线性探测：成功≈(1+1/(1-α))/2，失败≈(1+1/(1-α)²)/2。α越小性能越好。拉链允许α>1。'))
cards.push(card('data-structure', '拉链法特点', '拉链法处理冲突的优缺点？', '优点：空间灵活(α可>1)，删除方便，无聚集问题，ASL低。缺点：指针额外空间开销，链节点分散不连续影响缓存。综合性能优于开放定址法。'))
cards.push(card('data-structure', '散列表查找失败ASL计算', '线性探测散列表中如何计算查找失败的ASL？', '对每个同义词地址(0~p-1)，从该地址出发线性探测直到遇到空位置停止，统计探测次数。所有初始地址探测次数的平均值即为ASL失败。注意：超过m的探测以m计。'))

// 排序
cards.push(card('data-structure', '排序算法分类', '内部排序算法按策略分哪几类？', '1.插入：直接插入、折半插入、希尔 2.交换：冒泡、快排 3.选择：简单选择、堆排序 4.归并：二路归并 5.基数：LSD/MSD。还有计数、桶排序非比较型。'))

// 插入排序
cards.push(card('data-structure', '直接插入排序', '直接插入的最好最坏复杂度？适用场景？', '最好O(n)已有序，最坏O(n²)逆序。稳定。空间O(1)。适合小规模(n<50)和基本有序序列。常用作快排递归小规模收尾。'))
cards.push(card('data-structure', '折半插入排序', '折半插入排序的改进和局限？', '查找位置用折半O(logi)，但移元素仍O(n)，总O(n²)，仅减少比较次数。稳定。适用顺序存储。'))
cards.push(card('data-structure', '希尔排序', '希尔排序思想和增量序列影响？', '间隔d子序列分别直接插入排序，d递减到1。Shell增量O(n²)；Hibbard(2ᵏ-1)O(n^1.5)；Sedgewick O(n^(4/3))。不稳定。使序列逐渐趋于有序。'))

// 交换排序
cards.push(card('data-structure', '冒泡排序', '冒泡的最好/最坏复杂度？如何优化提前结束？', '最好O(n)一趟无交换，最坏O(n²)逆序。稳定。优化：设置flag，某趟无交换则已有序提前结束。'))
cards.push(card('data-structure', '快排复杂度', '快速排序平均/最坏时空复杂度？优化方法？', '平均O(nlogn)，最坏O(n²)(有序时)。空间O(logn)递归栈。不稳定。优化：三数取中选pivot；小规模转插入排序；尾递归优化减少递归深度。'))
cards.push(card('data-structure', '快排Partition', '快速排序Partition两种实现方法？', '1.挖坑法：pivot=a[low]，右扫找小放到左，左扫找大放到右，交替进行。2.双指针法：i=low-1,j从low到high-1扫描，a[j]≤pivot时++i并swap。均O(n)。'))
cards.push(card('data-structure', '快排最坏情况', '快排在什么情况下出现最坏O(n²)？如何避免？', '输入已有序或逆序且选首元素为pivot时每次划分极不均匀→O(n²)。避免：随机选pivot、三数取中法。但即使如此仍有可能输入恰好使每次pivot为极端值。'))

// 选择排序
cards.push(card('data-structure', '简单选择排序', '简单选择的过程、复杂度、不稳定性？', '每趟从i..n选最小与第i个交换，n-1趟。O(n²)与初始状态无关。不稳定例：[5,5,2]→[2,5,5]两5相对顺序变。'))
cards.push(card('data-structure', '堆排序', '堆排序的时空复杂度？建堆为何O(n)？', '建堆O(n)，排序O(nlogn)，总体O(nlogn)，空间O(1)。不稳定。升序大根堆。建堆从⌊n/2⌋向下调整，第k层节点数×下滤k次，求和为O(n)非O(nlogn)。'))
cards.push(card('data-structure', '堆的调整', '大根堆上滤和下滤代码逻辑？', '上滤(插入)：元素放末尾与父比较，大于父则交换向上。下滤(建堆/删顶)：根与最大孩子比较，小于则交换向下。建堆从⌊n/2⌋向下调整。'))

// 归并排序
cards.push(card('data-structure', '归并排序', '归并排序的时空复杂度？为什么稳定？', '时O(nlogn)，空O(n)辅助数组，稳定。两路归并log₂n趟每趟O(n)。稳定性源于合并时相等元素保持左段优先。'))

// 基数排序
cards.push(card('data-structure', '基数排序LSD/MSD', '基数排序LSD和MSD方法？时间复杂度？', 'LSD从个位开始排序，靠稳定性保证正确。d趟分配收集O(d(n+r))，r为基数。MSD从高位开始递归分组。LSD更常用。适用关键字可分多位的场景。'))

// 排序稳定性口诀
cards.push(card('data-structure', '排序稳定性口诀', '哪些排序稳定？哪些不稳定？口诀？', '稳定：直插、冒泡、归并、基数。不稳定：希尔、快排、简单选择、堆排序。口诀"快选堆希"不稳定。稳定性：相等关键字排序后相对位置不变。'))

// 外部排序
cards.push(card('data-structure', '外部排序过程', '外部排序的基本过程和优化？', '核心是归并。1.生成初始归并段(置换选择算法) 2.k路归并(败者树O(logk)选最小)。归并趟数=⌈logₖr⌉。增大k减少I/O趟数，但缓冲区变多。'))
cards.push(card('data-structure', '败者树', '败者树与胜者树的区别？在k路归并中作用？', '败者树内部记录败者(较大者)，胜者继续向上。重构仅需与上层败者比较O(logk)仅1次比较/层。胜者树重构需2次比较/层。败者树效率更高。'))
cards.push(card('data-structure', '最佳归并树', '最佳归并树是什么？如何构造？', '类似哈夫曼树，以初始归并段长度为权构造k叉最优归并树。若k-1不整除n初-1需补充0权虚段。每次选k个最小归并。'))
cards.push(card('data-structure', '置换选择排序', '置换选择排序如何生成初始归并段？', '用最小堆(大小=m)，从输入读取m个元素建堆。每次输出堆顶，读入新元素：若大于等于刚输出则入堆，否则暂存。堆空则一段结束。产生平均长度约2m的归并段。'))

// 排序选择
cards.push(card('data-structure', '排序算法选择', '不同场景如何选择排序算法？', 'n小(<50)→插入/选择。基本有序→直接插/冒泡。n大稳定→归并。n大不稳定→快排。n大大键值范围小→基数。内存有限→外部排序。TopK→堆排序或快排partition。'))

// 图
cards.push(card('data-structure', '图的基本概念', '无向图/有向图度数总和与边数的关系？完全图边数？', '无向：Σ度=2|E|。有向：Σ入=Σ出=|E|。完全图：无向n(n-1)/2，有向n(n-1)。连通图最少n-1边。强连通最少n边。'))
cards.push(card('data-structure', '图的存储比较', '邻接矩阵和邻接表的时空对比？', '邻接矩阵：O(V²)空间，判边O(1)，适稠密图。邻接表：O(V+E)空间，扫描O(度)，适稀疏图。无向图邻接表每条边出现两次。'))
cards.push(card('data-structure', 'BFS', 'BFS算法思想？时间/空间复杂度？', '借队列：从起点逐层访问，求无权图最短路径。邻接表O(V+E)，矩阵O(V²)。空间O(V)(所有节点可能同层入队)。可用于：最短路径、连通分量、二分图判定。'))
cards.push(card('data-structure', 'DFS', 'DFS算法思想？时间/空间复杂度？', '借栈(递归/显式栈)：回溯搜索，判环/拓扑排序/连通分量。邻接表O(V+E)，矩阵O(V²)。递归空间O(h)。遍历生成树含树边和回边。'))
cards.push(card('data-structure', 'DFS边分类', '有向图DFS四类边及判定？', '树边(T)：发现新节点。回边(B)：指向祖先→有环。前向边(F)：祖先指向已完成子孙。横边(C)：无祖先后代关系。判定用时间戳discover/finish。'))
cards.push(card('data-structure', '拓扑排序', '拓扑排序算法和判环方法？', '必要条件：DAG(有向无环图)。算法：1.选入度为0顶点输出 2.删该顶点和边 3.重复。O(V+E)。也可DFS完成时间逆序。若输出数<V则有环。'))
cards.push(card('data-structure', '关键路径', 'AOE网中ve/vl如何计算？关键路径定义？', 've(k)：源点到k的最长路径(正向取Max)。vl(k)：不推迟工期的前提下最迟时间(反向取Min，vl(汇)=ve(汇))。活动(i,j)：e=ve(i)，l=vl(j)-w(i,j)。l-e=0为关键活动。关键路径可能不止一条。'))
cards.push(card('data-structure', 'Dijkstra算法', 'Dijkstra算法时间和适用条件？', '朴素O(V²)，堆优化O((V+E)logV)。仅适用于非负权边(负权破坏贪心)。单源最短路径。贪心策略：每次选dist最小未确定顶点。若权值含负则需Bellman-Ford。'))
cards.push(card('data-structure', 'Bellman-Ford', 'Bellman-Ford能处理什么？复杂度？', '能处理负权边(Dijkstra不能)，可检测负权环。V-1轮松弛所有边，O(VE)。第V轮仍松弛→存在负权环。原因是无负权环的最长最短路径最多V-1条边。'))
cards.push(card('data-structure', 'Floyd算法', 'Floyd算法特点和为什么k必须最外层？', '所有顶点对最短路径。三重循环k,i,j。递推：d[k][i][j]=min(d[k-1][i][j], d[k-1][i][k]+d[k-1][k][j])。O(V³)。可处理负权边但不能负权环。k最外层因为动态规划阶段k表示前k个节点做中转。'))
cards.push(card('data-structure', 'Prim与Kruskal对比', 'Prim和Kruskal时间/适用/数据结构？', 'Prim：朴素O(V²)，堆优化O((V+E)logV)，适合稠密图。Kruskal：O(ElogE)，适合稀疏图。Prim邻接矩阵+dist数组；Kruskal用并查集判环。都是贪心MST。'))
cards.push(card('data-structure', 'MST唯一性', '什么时候最小生成树唯一？', '所有边权值互不相同时MST唯一。证明：反证，若两不同MST必有等权边。权值相等时MST可能不唯一但总权值必等。'))
cards.push(card('data-structure', 'Dijkstra与Prim的异同', 'Dijkstra和Prim算法的相似与区别？', '相似：都维护dist数组、贪心选最小值、O(V²)。区别：Dijk的dist是源点到各点的最短距离(累加)；Prim的dist是各点到MST的最短边权(不累加)。'))

// 其他技巧
cards.push(card('data-structure', '链表反转', '单链表反转的迭代和递归方法？', '迭代：pre=null,cur=head;循环:next=cur->next,cur->next=pre,pre=cur,cur=next。O(n)时间O(1)空间。递归：后部反转后head->next->next=head,head->next=null。O(n)时间O(n)空间。'))
cards.push(card('data-structure', '链表环检测', '如何检测单链表有环？找到环入口？', '快慢指针：快2慢1，相遇有环。找入口：相遇后一个从head(速1)一个从相遇点(速1)，再遇点即入口。证明：L=入口前长度，C环长，S相遇点距入口：2(L+S)=L+nC+S→L=nC-S。'))
cards.push(card('data-structure', '二分查找边界', '二分查找第一个≥target和最后一个≤target的写法？', '第一个≥：mid=l+r>>1;if(a[mid]>=target)r=mid;else l=mid+1。最后一个≤：mid=l+r+1>>1;if(a[mid]<=target)l=mid;else r=mid-1;注意上取整防死循环。返回l/r。'))
cards.push(card('data-structure', '跳跃表', '跳跃表(Skip List)结构和查找复杂度？', '有序链表多层索引，每层以概率升层。查找从最高层横向比较，无法前进则下降。期望层数O(logn)，查找/插入/删除期望O(logn)。对应平摊概率均衡。Redis有序集合使用。'))
cards.push(card('data-structure', '强连通分量SCC', '求有向图SCC的Kosaraju和Tarjan算法？', 'Kosaraju：2次DFS，1次得完成逆序，2次在反向图上按逆序DFS得SCC。Tarjan：1次DFS+栈，low[v]=min(dfn[v],low[u],dfn[backedge])。dfn=low时出SCC。均O(V+E)。'))
cards.push(card('data-structure', 'Master定理', 'Master定理三种情况的判定？举例？', 'T(n)=aT(n/b)+f(n)。Case1:f(n)=O(n^{logₐb-ε})→Θ(n^{logₐb})。Case2:f(n)=Θ(n^{logₐb})→Θ(n^{logₐb}logn)。Case3:f(n)=Ω(n^{logₐb+ε})且af(n/b)≤cf(n)(c<1)→Θ(f(n))。T(n)=2T(n/2)+n→Case2。'))
cards.push(card('data-structure', '栈混洗数量', 'n个元素经过一个栈可得到多少种排列？', '卡特兰数Cₙ。即合法出栈序列数=Cₙ。不是所有排列都可达！例如入栈序123不能得312。约束：任意前缀中出栈数≤入栈数。'))
cards.push(card('data-structure', '二叉树的层遍历应用', '二叉树的层序遍历算法和应用？', '队列辅助：根入队，循环出队访问、左右子入队。O(n)时间O(n)空间。应用：1.层次打印 2.求树宽度(BFS) 3.求最小深度 4.判断完全二叉树(遇到NULL后不应再有非NULL)。'))
cards.push(card('data-structure', '完全二叉树的判定', '如何判定一棵二叉树是完全二叉树？', '层序遍历，遇到第一个NULL节点后标记flag=true，之后遇到任何非NULL节点则不是完全二叉树。若遍历结束无问题则是。'))
cards.push(card('data-structure', 'BST判定', '如何判断一棵二叉树是否是BST？', '中序遍历，检查是否严格递增。或递归：传入合法上下界(root->val必须大于下界小于上界)，左右子递归更新界。O(n)时间O(h)空间。'))

// ==================== 计算机组成原理 (约200张) ====================

cards.push(card('computer-organization', '冯诺依曼结构', '冯诺依曼体系结构的核心思想和五部件？', '核心：存储程序(程序和数据的二进制存入存储器，CPU自动取指执行)。五部件：运算器(ALU)、控制器(CU)、存储器、输入设备、输出设备。瓶颈：CPU-存储器带宽。'))
cards.push(card('computer-organization', '计算机性能指标', 'CPU主频、CPI、MIPS、MFLOPS含义和公式？', 'CPU时间=指令数×CPI×时钟周期=指令数×CPI/主频。CPI每条指令平均周期数。MIPS=主频(MHz)/CPI衡量定点。MFLOPS=浮点操作/时间×10⁶，更客观。'))
cards.push(card('computer-organization', '进制转换', '二进制、八进制、十六进制的快速转换方法？', '二→八：3位一组。二→十六：4位一组。八→二：每1位转3位。十六→二：每1位转4位。十→二：整数除2取余倒序；小数乘2取整正序。0.1₁₀转二进制无限循环。'))
cards.push(card('computer-organization', '原反补码范围', '8位原码/反码/补码/移码表示范围？', '原码：-127~+127(±0)。反码：-127~+127(±0)。补码：-128~+127(0唯一，多表示一负数)。移码：-128~+127(=补码符号位取反，用于浮点阶码)。n位补码：-2^(n-1)~2^(n-1)-1。'))
cards.push(card('computer-organization', '补码运算特征', '补码三大特征？[A-B]补如何计算？', '1.符号位参与运算 2.0唯一 3.减法转加法：[A-B]补=[A]补+[-B]补。求[-B]补：已知[B]补连符号位取反+1。统一处理加减无需减法器。'))
cards.push(card('computer-organization', '溢出判断三法', '补码运算的三种溢出判断？', '1.双符号位(变形补码)：00正，11负，01正溢，10负溢。2.进位判别：Cn⊕C{n-1}=1溢出(Cn符号位进位，C{n-1}最高数值位进位)。3.操作数符号：正+正=负(正溢)，负+负=正(负溢)。正+负永不会溢出。'))
cards.push(card('computer-organization', '移码特点', '移码特点和浮点数阶码为何用移码？', '移码=真值+2^(n-1)，=补码符号取反。无符号数比较即比较真值，便于浮点对阶(比较阶码)。IEEE754单精度偏移127、双精度1023。'))
cards.push(card('computer-organization', 'BCD码', '8421BCD和余3码的区别？BCD运算为何需修正？', '8421BCD：4位二进制1位十进制(0000~1001)，非法1010~1111。余3=8421+0011，自补码(取反得9补)。运算修正：和>9或产生进位则+6修正(跳过6个非法编码)。'))
cards.push(card('computer-organization', 'IEEE754单双精度', 'IEEE754单精度/双精度的格式？真值公式？', '单精度32位：1S+8E(偏移127)+23M(隐藏1)。双精度64位：1S+11E(偏移1023)+52M。规格化数真值=(-1)^S×1.M×2^(E-127/1023)。'))
cards.push(card('computer-organization', 'IEEE754特殊值', 'IEEE754中阶码全0和全1表示什么？', 'E全0+M全0=±0。E全0+M非0=非规格化数(隐藏位=0,指数-126)。E全1+M全0=±∞。E全1+M非0=NaN(0/0,∞-∞)。E=1~254是规格化数。单精度最小正规格化数=2^(-126)。'))
cards.push(card('computer-organization', '浮点加减五步', '浮点数加减运算五步？为何小阶向大阶？', '1.对阶(小→大，尾数右移，可能丢精度；大→小会丢高位)。2.尾数加减。3.规格化(左规尾数非1左移；右规双符号位不一致右移)。4.舍入。5.溢出判断。'))
cards.push(card('computer-organization', '浮点舍入方式', '浮点四种舍入方式？IEEE754默认？', '1.截断(丢弃) 2.0舍1入(末位) 3.恒置1 4.最近舍入(Round-to-Nearest-Even,IEEE默认，中间值向偶数舍入)。RNE最均衡无系统偏差。'))
cards.push(card('computer-organization', 'Booth乘法', '原码乘法和Booth算法的区别？', '原码乘法：符号位单独(异或)，数值部分绝对值乘(加/不加)。Booth补码：符号位参与运算，低位+附加位：10则[-X]补，01则[+X]补，00/11加0。每次算术右移。n次加n次移。'))
cards.push(card('computer-organization', 'ALU', 'ALU加法器进位方式有哪些？', '串行进位(延迟O(n))；先行进位CLA：Gᵢ=AᵢBᵢ,Pᵢ=Aᵢ⊕Bᵢ,Ci+1=Gi+PiCi可并行；分组并行(组内并行组间串/并)。74181经典4位ALU。'))
cards.push(card('computer-organization', 'SRAM_vs_DRAM', 'SRAM和DRAM对比？DRAM为何需刷新？', 'SRAM：6管触发器，快速(ns)，无刷新，集成度低功耗大，Cache用。DRAM：1管1电容，需刷新(电容漏电)，集成度高容量大，主存用。刷新方式：集中/分散/异步。'))
cards.push(card('computer-organization', '存储器层次', '存储器层次结构原理？时间/空间局部性？', '金字塔：寄存器→Cache→主存→辅存，速度递减容量递增价格递减。原理：时间局部性(刚访问的近期再访)；空间局部性(附近地址可能被访)。上层是下层缓存。'))
cards.push(card('computer-organization', 'Cache三映射', 'Cache直接/全相联/组相联映射特点？', '直接：固定位置，简单快但冲突多。全相联：任意位置，冲突少但查找慢。组相联：N路一组，折中最常用。主存地址拆tag|index|offset。'))
cards.push(card('computer-organization', 'Cache平均访问时间', 'Cache平均访问时间公式？', '平均时间=命中率×Tc+(1-命中率)×Tm 或 =HitTime+MissRate×MissPenalty。提高命中率或降低缺失开销可提升性能。'))
cards.push(card('computer-organization', 'Cache替换算法', 'RAND/FIFO/LRU/LFU对比？LRU硬件实现？', 'RAND随机；FIFO先进先出(可能有Belady)；LRU最近最少用(命中率高但硬件复杂)；LFU最不常用。LRU计数器法或栈法，近似LRU用CLOCK/NRU。'))
cards.push(card('computer-organization', 'Cache写策略', '写直达与写回区别？写分配与非写分配？', '写直(Write-through)：同时写Cache+主存，简单慢(每次访存)。写回(Write-back)：只写Cache，替换时写回(需脏位Dirty)。写分配：写不命中时调块入Cache再写。通常写回+写分配或写直+非写分配搭配。'))
cards.push(card('computer-organization', 'Cache与主存地址映射', '直接映射Cache如何拆分主存地址？3部分含义？', '主存地址=Tag(区号)|Index(行号)|Offset(块内偏移)。主存容量/Cache容量=区数。Tag用于判断是否命中，Index定位Cache行，Offset访问块内字节。'))
cards.push(card('computer-organization', 'Cache容量计算', '给定Cache容量、块大小、地址线数，如何计算Tag/Index/Offset位数？', 'Offset=log₂(块字节数)。Index=log₂(Cache行数)=log₂(Cache容量/块大小)。Tag=地址总线数-Index-Offset。例：4KB Cache,16B块,1路→Index=log₂(4096/16)=8位。'))
cards.push(card('computer-organization', '多级Cache', 'L1/L2/L3 Cache各自特点？', 'L1：小(32-64KB)、快(1-2周期)、分指令/数据(哈佛结构)。L2：较大(256KB-2MB)、中等(~10周期)、统一。L3：大(数MB)、较慢(~30周期)、多核共享。分级降低平均延迟。'))
cards.push(card('computer-organization', 'TLB', 'TLB作用和地址转换流程？', 'TLB(快表/旁路缓冲)是页表Cache加速虚实转换。流程：虚地址→查TLB(命中得物理页框)→查Cache物理地址→数据。TLB不命中需访页表(可能在Cache)或触发缺页中断。'))
cards.push(card('computer-organization', '虚拟存储器', '页式/段式/段页式的区别？', '页式：等大页，页表转换，TLB加速，无外碎片。段式：按逻辑分段(各段大小不一)，段表(基址+段长)，有外碎片。段页式：先段再页(段号+页号+页内偏移)，综合优点(逻辑分隔+无碎片)。'))
cards.push(card('computer-organization', '页表结构', '多级页表和倒排页表各自用途？', '多级页表：页目录+页表，节省连续内存空间(大地址空间稀疏使用时)。倒排页表：全局一个表，物理帧→虚实映射，按物理页框索引，节省空间但查找慢(Hash加速)。'))
cards.push(card('computer-organization', '存储器容量扩展', '如何用芯片扩展字长和字数？', '位扩展(扩字长)：多片并联地址线/片选线共用，数据线拼接。字扩展(扩容量)：多片地址线共用，片选信号区分芯片。综合扩展：先位扩展后字扩展。芯片数=总容量/单片容量。'))

// 指令系统
cards.push(card('computer-organization', '指令地址码', '三/二/一/零地址指令特点和访存次数？', '三地址OP D,S1,S2：4次访存。二地址OP D,S：D←D OP S，3次访存。一地址OP A：隐ACC，2次访存。零地址：栈操作，隐含操作数。地址少指令短但可能需更多指令。RISC多三地址。'))
cards.push(card('computer-organization', '寻址方式', '常见7种寻址方式及有效地址计算？', '1.立即：操作数在指令。2.直接：EA=A。3.间接：EA=(A)。4.寄存器直接：EA=R。5.寄存器间接：EA=(R)。6.变址：EA=(IX)+A(数组)。7.基址：EA=(BR)+A(重定位)。8.相对：EA=(PC)+A(转移)。'))
cards.push(card('computer-organization', 'CISC_vs_RISC', 'CISC和RISC核心区别？典型代表？', 'CISC(x86)：不等长指令，多周期，多寻址，微程序控制，寄存器少，编译器简。RISC(ARM/MIPS)：定长32位，单周期/Load-Store，硬布线，寄存器多(32)，流水线友好。现代CPU融合：CISC外表+RISC内核。'))
cards.push(card('computer-organization', '指令周期与机器周期', '指令周期/机器周期/时钟周期的区别？', '时钟周期(节拍)：主频倒数T=1/f，最小单位。机器周期(CPU周期)：完成一个基本操作(如访存)的时间。指令周期：收取一条指令的时间=取指+间址+执行+中断周期。'))
cards.push(card('computer-organization', 'CPU内部寄存器', 'CPU有哪些主要寄存器及作用？', '通用寄存器组(GPR)、PC(程序计数器存下条指令地址)、IR(指令寄存器存当前指令)、MAR/MDR(访存地址/数据寄存器)、PSW(程序状态字含标志位)、SP(栈指针)。'))

// 流水线
cards.push(card('computer-organization', '流水线性能指标', '流水线加速比/吞吐率/效率公式？', '加速比S=nk/(k+n-1)，n→∞趋近k。吞吐率TP=n/((k+n-1)Δt)→1/Δt(n→∞)。效率E=n/(k+n-1)→1(n→∞)。实际达不到理论因段不等长/装入排空/冒险/中断。'))
cards.push(card('computer-organization', '数据冒险', 'RAW/WAR/WAW含义？哪些可转发解决？', 'RAW(写后读)：i写j读→须转发或stall，最常见。WAR(读后写)：i读j写→乱序时出现，寄存器重命名解。WAW(写后写)：两指令写同寄存器→重命名解。RAW可旁路转发bypassing直接传结果。'))
cards.push(card('computer-organization', '控制冒险', '分支冒险的解决方法？', '1.冻结/冲刷流水线 2.静态分支预测(总预不跳/总预跳) 3.动态分支预测(1位/2位预测器，BHT) 4.延迟分支(分支槽填充NOP或有用指令) 5.分支目标缓冲(BTB)。2位预测器精度>90%。'))
cards.push(card('computer-organization', '结构冒险', '什么是结构冒险及其解决方法？', '多条指令竞争同一硬件资源(如单一存储器). 解决方法：1.增加硬件资源(Harvard架构分离指令/数据Cache) 2.流水线停顿(stall)插入一个气泡。'))
cards.push(card('computer-organization', '流水线数据转发', '数据旁路(forwarding)如何工作？', '执行阶段ALU得到结果立即通过旁路路径将结果(无需等写回阶段写寄存器)直接送入下条指令的EX阶段输入端。EX/MEM流水段间寄存器的结果转发到EX阶段。'))

// 总线
cards.push(card('computer-organization', '总线分类', '系统总线分为哪三类？各自传输内容？', '数据总线(DB)：双向传输数据，宽度决定一次传输量。地址总线(AB)：单向传输地址，宽度决定寻址范围。控制总线(CB)：传输控制/状态信号(读/写/中断等)。'))
cards.push(card('computer-organization', '总线仲裁', '总线仲裁的集中式和分布式方式？', '集中式：链式查询(菊花链，简单但不公)；计数器定时查询(灵活)；独立请求方式(快但线多)。分布式：各设备自裁决，依据设备标识号(优先权自决定)。'))
cards.push(card('computer-organization', '总线定时', '同步和异步通信的区别？', '同步：统一时钟信号定时，所有设备按固定时序工作，速度快但灵活性差。异步：通过握手信号交互(不互锁/半互锁/全互锁)，灵活可连接速度不同设备，但复杂控制开销大。'))
cards.push(card('computer-organization', '总线带宽计算', '总线带宽如何计算？', '总线带宽=总线宽度×时钟频率/传输周期数。例：64位宽100MHz总线每2周期传一次→带宽=8Bytes×100MHz/2=400MB/s。总线标准：PCI、PCIe、USB。'))

// I/O
cards.push(card('computer-organization', 'I/O编址方式', '统一编址和独立编址区别？', '统一编址(存储器映射I/O)：I/O端口和主存统一编址，用访存指令访I/O(MOV/LOAD/STORE)，节省指令但占用地址空间。独立编址：I/O有独立地址空间，需专用I/O指令(IN/OUT)。'))
cards.push(card('computer-organization', '程序查询_vs_中断', '程序查询方式和中断方式的区别？', '程序查询：CPU不断读状态寄存器判断外设是否就绪(轮询)，CPU利用率低实时性差。中断方式：外设就绪时主动发中断请求，CPU响应中断处理，利用率高实时性好。'))
cards.push(card('computer-organization', 'DMA方式', 'DMA与中断方式的核心区别？DMA三种模式？', 'DMA：批量数据由DMA控制传输，CPU仅开始结束参与，适用高速设备。中断：每字节触发CPU处理。DMA三模式：1.停止CPU访存 2.周期挪用(cycle stealing最常用) 3.交替访问。'))
cards.push(card('computer-organization', '中断响应优先级', '中断判优(优先级)的软硬件实现？', '硬件：菊花链(链式优先权)、中断控制器(如8259A，可编程优先级)。软件：查询法(CPU按优先级顺序查询中断源)。硬件判优快；软件判优灵活但慢。'))
cards.push(card('computer-organization', '多重中断与中断屏蔽', '多重中断的条件？中断屏蔽如何实现？', '条件：CPU允许中断(IF=1)、更高级别中断请求。保留断点后可以响应新中断。屏蔽：设置中断屏蔽字(每一位对应一个中断源，1为屏蔽)，动态改变各中断源的响应次序。'))
cards.push(card('computer-organization', '中断隐指令', '中断隐指令完成哪些操作？和普通指令区别？', '中断隐指令(硬件自动)：1.关中断 2.保存断点(PC)和PSW 3.取ISR入口地址(中断向量法)。不是编程指令，是硬件在中断响应时自动执行的操作序列。'))
cards.push(card('computer-organization', '中断服务程序流程', '中断服务程序ISR的完整流程？', '1.保护现场(寄存器压栈) 2.开中断(允多重中断) 3.执行中断处理 4.关中断(恢复现场时不被打断) 5.恢复现场 6.开中断 7.中断返回(IRET指令恢复PC和PSW)。'))
cards.push(card('computer-organization', '通道方式', '通道控制方式的原理和类型？', '通道是专门处理I/O的处理器(比DMA更高级)。字节多路通道(低速多设备时分复用)；选择通道(高速设备独占通道)；数组多路通道(折中，多个高速设备时分复用)。'))
cards.push(card('computer-organization', '磁盘性能指标', '磁盘平均存取时间和数据传输率公式？', '平均存取时间=平均寻道时间+平均旋转延迟(1/2转)+传输时间(字节数/传输率)。平均寻道通常最大寻道和的1/3。旋转速度rpm：平均延迟=1/2×(60/rpm)秒。'))
cards.push(card('computer-organization', 'RAID', 'RAID 0/1/5/10的特点？', 'RAID0条带化(性能好无冗余)。RAID1镜像(满冗余容量减半)。RAID5块级分布式校验(至少3盘，容许1盘失效，读好写差)。RAID10/01:RAID1+0条带镜像容错性好但成本高。'))

// 数据通路
cards.push(card('computer-organization', '单总线数据通路', '单总线结构CPU执行指令涉及哪些基本操作？', '取指：PC→MAR→主存→MDR→IR，PC+1。间址：IR中地址→MAR→主存→MDR。执行：ALU运算操作数→结果写回。每个微操作在一个时钟周期(节拍)完成。'))
cards.push(card('computer-organization', '微程序_vs_硬布线', '微程序控制和硬布线控制的区别？', '微程序：控制信号由控存读取，ROM存微指令，灵活但慢(CISC用)。硬布线(组合逻辑)：门电路直接产生控制信号，快但复杂不灵活(RISC用)。现代CPU两者结合。'))
cards.push(card('computer-organization', '微指令格式', '微指令的编码方式和分类？水平型vs垂直型？', '水平型：每位直接控制一个信号，并行度高，速度快但字长。垂直型：类似机器指令，编码紧凑但并行度低需译码。混合型：字段直接编码(相斥信号同字段)，最常用。'))
cards.push(card('computer-organization', '数据通路时间分析', '单周期和多周期CPU的区别？', '单周期：所有指令在1个(最长)时钟周期完成，CPI=1但周期长(最慢指令)。多周期：指令分多少不等的时钟周期完成，周期短但CPI>1。流水线CPU每个周期可发射1指令(理想CPI→1)。'))
cards.push(card('computer-organization', '指令流水线阶段', '经典五段式流水线各阶段做什么？', 'IF(取指)：PC→IM；ID(译码)：读寄存器、立即数扩展；EX(执行)：ALU运算或地址计算；MEM(访存)：Load/Store；WB(写回)：结果写寄存器。每段1周期，指令重叠执行。'))
cards.push(card('computer-organization', '流水线阻塞原因', '流水线阻塞(stall)的主要原因有哪些？', '1.数据相关(RAW)需等前指令结果 2.控制相关(分支)取址不确定 3.结构相关(资源竞争) 4.长延迟指令(乘/除/浮点)多周期执行 5.Cache缺失等外部延迟。'))
cards.push(card('computer-organization', '超标量与超流水', '超标量和超流水线的区别？', '超标量：每周期发射多条指令(多套执行单元) ILP>1。超流水线：细分流水段提高主频(段数更多，每周期发射1条但周期更短)。VLIW：长指令字一次发射多个操作。'))
cards.push(card('computer-organization', 'Cache一致性', '多核Cache一致性协议基本思想？', 'MESI协约：Modified(已改独占)、Exclusive(干净独占)、Shared(共享)、Invalid(无效)。核心保证：多核对同一地址的写入能被其他核看到。写失效(Write-Invalidate)和写更新(Write-Update)策略。'))
cards.push(card('computer-organization', '大小端模式', '大端(Big Endian)和小端(Little Endian)的区别？', '大端：高字节低地址(内存地址0存高位)。小端：低字节低地址(内存地址0存低位)。x86小端；网络字节序大端。C语言union方式检测。'))

console.log(`Data Structure cards: ${cards.filter(c=>c.subject==='data-structure').length}`)
console.log(`Computer Org cards: ${cards.filter(c=>c.subject==='computer-organization').length}`)

// Append OS and Network cards
cards.push(...osCards)
console.log(`OS cards: ${osCards.length}`)
cards.push(...cnCards)
console.log(`Network cards: ${cnCards.length}`)
cards.push(...dsExtraCards)
console.log(`DS extra cards: ${dsExtraCards.length}`)
cards.push(...coExtraCards)
console.log(`CO extra cards: ${coExtraCards.length}`)
cards.push(...dsMoreCards)
console.log(`DS more cards: ${dsMoreCards.length}`)
cards.push(...coMoreCards)
console.log(`CO more cards: ${coMoreCards.length}`)
cards.push(...osMoreCards)
console.log(`OS more cards: ${osMoreCards.length}`)
cards.push(...cnMoreCards)
console.log(`CN more cards: ${cnMoreCards.length}`)
cards.push(...dsMore2Cards)
console.log(`DS more2 cards: ${dsMore2Cards.length}`)
cards.push(...coMore2Cards)
console.log(`CO more2 cards: ${coMore2Cards.length}`)
cards.push(...osMore2Cards)
console.log(`OS more2 cards: ${osMore2Cards.length}`)
cards.push(...cnMore2Cards)
console.log(`CN more2 cards: ${cnMore2Cards.length}`)

const outputPath = path.join(import.meta.dirname, '..', 'src', 'data', 'flashcards.json')
fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2), 'utf-8')
console.log(`Total cards: ${cards.length}`)
console.log(`Written to ${outputPath}`)

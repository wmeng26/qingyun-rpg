// 对话脚本：{ entry, nodes: { nodeId: node } }
// node: { speaker, portrait, text, next | branch | choices, actions(进入节点时执行) }
// choice: { text, next(null=结束), cond?, actions? }
// cond: {quest:{id,state}} | {flag} | {flagAbsent} | {realm:'zhuji'} | {item:{id,count}} | {ally:'liu'} | {all:[...]} | {any:[...]}
// actions: startQuest/completeQuest/giveItem/giveGold/setFlag/joinAlly/startBattle/openShop(id=shops.js)/healFull
export default {
  dlg_prologue: {
    entry: 'n1',
    nodes: {
      n1: { speaker: '', text: '大梁末年，妖魔渐起，乱世将至。', next: 'n2' },
      n2: { speaker: '', text: '青云山上仙门林立。山脚少年萧逸，自幼梦求仙道。', next: 'n3' },
      n3: { speaker: '', text: '这一日，他拜别双亲，独自踏上青云山道——', next: 'n4' },
      n4: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '听说青云门正在招收外门弟子……先上山去瞧瞧吧。',
        next: null,
      },
    },
  },

  dlg_zhangmen: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen', text: '',
        branch: [
          { cond: { quest: { id: 'quest_main_14', state: 'ready' } }, next: 'turnin14' },
          { cond: { quest: { id: 'quest_main_14', state: 'active' } }, next: 'progress14' },
          { cond: { quest: { id: 'quest_main_14', state: 'available' } }, next: 'offer14' },
          { cond: { quest: { id: 'quest_main_13', state: 'ready' } }, next: 'turnin13' },
          { cond: { quest: { id: 'quest_main_13', state: 'active' } }, next: 'progress13' },
          { cond: { quest: { id: 'quest_main_13', state: 'available' } }, next: 'offer13' },
          { cond: { quest: { id: 'quest_main_12', state: 'ready' } }, next: 'turnin12' },
          { cond: { quest: { id: 'quest_main_12', state: 'active' } }, next: 'progress12' },
          { cond: { quest: { id: 'quest_main_12', state: 'available' } }, next: 'offer12' },
          { cond: { quest: { id: 'quest_main_14', state: 'completed' } }, next: 'post_ch5' },
          { cond: { quest: { id: 'quest_main_8', state: 'completed' } }, next: 'north_hint' },
          { cond: { quest: { id: 'quest_main_8', state: 'ready' } }, next: 'turnin8' },
          { cond: { quest: { id: 'quest_main_8', state: 'active' } }, next: 'progress8' },
          { cond: { quest: { id: 'quest_main_8', state: 'available' } }, next: 'offer8' },
          { cond: { quest: { id: 'quest_main_7', state: 'ready' } }, next: 'turnin7' },
          { cond: { quest: { id: 'quest_main_7', state: 'active' } }, next: 'progress7' },
          { cond: { quest: { id: 'quest_main_7', state: 'available' } }, next: 'offer7' },
          { cond: { quest: { id: 'quest_main_6', state: 'ready' } }, next: 'turnin6' },
          { cond: { quest: { id: 'quest_main_6', state: 'active' } }, next: 'progress6' },
          { cond: { quest: { id: 'quest_main_6', state: 'available' } }, next: 'offer6' },
          { cond: { quest: { id: 'quest_main_5', state: 'ready' } }, next: 'turnin5' },
          { cond: { quest: { id: 'quest_main_5', state: 'active' } }, next: 'progress5' },
          { cond: { quest: { id: 'quest_main_5', state: 'available' } }, next: 'offer5' },
          { cond: { quest: { id: 'quest_main_4', state: 'ready' } }, next: 'turnin4' },
          { cond: { quest: { id: 'quest_main_4', state: 'active' } }, next: 'progress4' },
          { cond: { quest: { id: 'quest_main_4', state: 'available' } }, next: 'offer4' },
          { cond: { quest: { id: 'quest_main_3', state: 'ready' } }, next: 'turnin3' },
          { cond: { quest: { id: 'quest_main_3', state: 'active' } }, next: 'progress3' },
          { cond: { quest: { id: 'quest_main_3', state: 'available' } }, next: 'offer3' },
          { cond: { quest: { id: 'quest_main_2', state: 'ready' } }, next: 'turnin2' },
          { cond: { quest: { id: 'quest_main_2', state: 'active' } }, next: 'progress2' },
          { cond: { quest: { id: 'quest_main_2', state: 'available' } }, next: 'offer2' },
          { cond: { quest: { id: 'quest_main_1', state: 'ready' } }, next: 'turnin1' },
          { cond: { quest: { id: 'quest_main_1', state: 'active' } }, next: 'progress1' },
          { cond: { quest: { id: 'quest_main_1', state: 'available' } }, next: 'offer1' },
        ],
        next: 'default',
      },
      north_hint: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '魔主之名，老道也只在祖师的残卷里见过一字半句……\n北面寒霜渡的求援信，已经到了三次。萧逸，带着你的同伴们——去北边吧。',
        next: null,
      },
      // ---- 第五章：血煞之上 ----
      offer12: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '萧逸，庆功酒怕是要凉一凉了。\n北境传来的密报：血煞教并未根绝——残党正往西南古窟集结，誓要迎回一个名讳。老道查遍禁书，只在夹页里寻到四个字——「血煞之上」。',
        choices: [
          { text: '魔主既灭，余孽何惧！', next: 'offer12b', actions: [{ do: 'startQuest', id: 'quest_main_12' }] },
          { text: '容我先准备一下。', next: null },
        ],
      },
      offer12b: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '后山已为人开路，直通赤煞窟。窟中赤衣祭酒以血为祭——剿灭四人，夺其血符。\n切记：此番对手，是潜心千年之辈。粮草丹药，务必带足。',
        next: null,
      },
      progress12: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '赤煞窟中赤袍祭酒仍在血祭——多加搜剿，莫放走一人。',
        next: null,
      },
      turnin12: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '血符上竟刻着同一篇祭文……赤魂晶、幻境之门——原来血煞教千年香火，供的从来不是魔主玄冥。',
        actions: [{ do: 'completeQuest', id: 'quest_main_12' }],
        next: 'offer13',
      },
      offer13: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '窟中古碑有载：集齐三枚赤魂晶，可开「煞天幻境」之门。\n而门后之人，恐怕远在魔主之上——欲入幻境，你须再破一境。炼虚丹在此，去会一会那些「赤魂使者」吧。',
        choices: [
          { text: '弟子领命！', next: 'offer13b', actions: [{ do: 'startQuest', id: 'quest_main_13' }] },
          { text: '容我些时日。', next: null },
        ],
      },
      offer13b: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '窟中两位赤魂使者各怀一晶，另一位……或藏于更深处。三晶集齐，丹成炼虚，方可叩门。\n（在「角色」页以炼虚丹冲击炼虚期。）',
        next: null,
      },
      progress13: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '赤魂晶尚未集齐，炼虚之境也未可懈怠——窟中赤焰蝠身上或有余晶。',
        next: null,
      },
      turnin13: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '三晶共鸣，炼虚天成——好！好！好！\n窟门已应声而开。门后便是煞天幻境，千年血祭的真凶就在彼处。此去……老道不送了，送你一句祖师遗言：莫信眼前。',
        actions: [{ do: 'completeQuest', id: 'quest_main_13' }],
        next: 'offer14',
      },
      offer14: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '幻境之门已开，退路只有一条——向前。\n带上天问剑、赤霞袍，带着你的同伴。去终结这段千年的血债吧，萧逸。',
        choices: [
          { text: '弟子此去，不斩赤渊，誓不回山！', next: null, actions: [{ do: 'startQuest', id: 'quest_main_14' }] },
          { text: '容我先整备行装。', next: null },
        ],
      },
      progress14: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '幻境之门就在窟顶。莫信眼前所见——去吧。',
        next: null,
      },
      turnin14: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '（老道接过血符，久久无言，终是长揖及地。）\n千年血祭，一朝而清。萧逸——自今日起，你的名字，可入仙史了。',
        actions: [{ do: 'completeQuest', id: 'quest_main_14' }],
        next: null,
      },
      post_ch5: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '血煞既清，天下升平。\n后山轮回塔中幻境重演，守塔人古尘仍在等你——仙途无尽，剑不可钝。',
        next: null,
      },
      offer6: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '萧逸，你来看——黑风寨缴获的密信，落款处按着一枚血印：血煞教。\n老道查遍典籍：百年前被正道围剿的魔门，竟未死绝……近日山道上出现的红衣蒙面人，多半便是它的爪牙。',
        choices: [
          { text: '弟子去会会他们！', next: 'offer6b', actions: [{ do: 'startQuest', id: 'quest_main_6' }] },
          { text: '容我先准备一下。', next: null },
        ],
      },
      offer6b: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '荒古道深草之中，近来常见红衣教徒出没。擒杀三人，搜其随身之物——\n血煞教行事，从来不留活口，你也不必留。',
        next: null,
      },
      progress6: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '红衣蒙面者仍在山道游弋。深草之中，多加搜剿！',
        next: null,
      },
      turnin6: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '血煞珠？！这等魔物……竟以活人精血炼丹。\n从这些珠子里残存的气息看，他们的老巢，就在西山更深处——血煞谷。',
        actions: [{ do: 'completeQuest', id: 'quest_main_6' }],
        next: 'after6',
      },
      after6: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '荒古道北面的谷口，老道已请人破开一道缝隙。\n谷中有位隐居的采药人，通晓谷中虚实——先去寻他。此行凶险，九转丹务必带足！',
        next: null,
      },
      offer7: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '采药人既已带了话，你便入谷走一遭：先除血煞左使，断其一臂！\n只是谷底祭坛的禁制，非金丹修为不可近身——切记先成丹，再叩坛。',
        choices: [
          { text: '弟子明白！', next: null, actions: [{ do: 'startQuest', id: 'quest_main_7' }] },
          { text: '容我先准备一下。', next: null },
        ],
      },
      progress7: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '',
        branch: [
          { cond: { realm: 'jindan' }, next: 'progress7b' },
        ],
        next: 'progress7a',
      },
      progress7a: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '金丹未成，坛门不开。以你如今的修为，突破只是水到渠成——（在「角色」面板以金元丹冲击金丹）。',
        next: null,
      },
      progress7b: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '金丹已成？好！去罢——谷中除魔，先断左使一臂，再回山复命。',
        next: null,
      },
      turnin7: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '左使已诛？好！金丹亦成——萧逸，你已是青云门百年来最年轻的金丹修士。\n祭坛禁制，老道拼着法力大损，也为你撕开一道口子。',
        actions: [{ do: 'completeQuest', id: 'quest_main_7' }],
        next: 'after7',
      },
      after7: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '此去祭坛，是真正的死地。把玄晶甲、九转丹都备齐——\n若老道久候你不归……也罢，青云门的事，青云门自己了断。去吧！',
        next: null,
      },
      offer8: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '禁制已开，最后一战到了。\n血煞教主蛰伏百年，其血祭之术可撼山岳——萧逸，这一战，只许胜，不许败！',
        choices: [
          { text: '若不覆灭血煞，誓不回山！', next: null, actions: [{ do: 'startQuest', id: 'quest_main_8' }] },
        ],
      },
      progress8: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '祭坛就在谷底最深处。同伴都还等着你——不可轻敌，更不可恋战。',
        next: null,
      },
      turnin8: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '……当真覆灭了？好，好！百年魔教，一朝倾覆——天下太平，又添一分。\n萧逸，你如今已是元婴修士，江湖之大，任你去得。青云门，永远是你的家。',
        actions: [{ do: 'completeQuest', id: 'quest_main_8' }],
        next: null,
      },
      offer4: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '萧逸，自你除掉幽冥老祖，江湖上已有了你的名号。\n可探子来报：山道深草里，仍有黑风寨的探子出没——查探青云门虚实，其心可诛。',
        choices: [
          { text: '弟子领命，去会会他们！', next: 'offer4b', actions: [{ do: 'startQuest', id: 'quest_main_4' }] },
          { text: '容我先准备一下。', next: null },
        ],
      },
      offer4b: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '探子就混在山下的深草里。不必留活口——斩杀三人，杀一儆百！',
        next: null,
      },
      progress4: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '探子未尽，山道不宁。深草之中，多加搜剿！',
        next: null,
      },
      turnin4: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '探子伏诛？好！从他们随身之物里，老道已问出实情——\n黑风寨啸聚匪众、劫掠商旅，竟与幽冥洞的邪修暗通款曲。尸傀之乱，只怕也有他们一份。',
        actions: [{ do: 'completeQuest', id: 'quest_main_4' }],
        next: 'after4',
      },
      after4: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '西面山道的路障，老道已命人撤去。\n出山下西门，沿荒古道向西——先找路边的落难货郎问问寨中虚实。此去路远，多备丹药！',
        next: null,
      },
      offer5: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '既然带了货郎的话，你便替青云门走一遭：踏平黑风寨，取黑风王首级！\n柳师姐与洛姑娘，都带上吧。',
        choices: [
          { text: '万死不辞！', next: null, actions: [{ do: 'startQuest', id: 'quest_main_5' }] },
          { text: '容我先准备一下。', next: null },
        ],
      },
      progress5: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '黑风寨三面绝壁，只有南面一座寨门。堂堂正正杀进去便是——切记，不可轻敌。',
        next: null,
      },
      turnin5: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '……好！黑风寨一平，西山商路复通，青云门上下的心头大患也算除去了。\n只是此番缴获的密信，越看越是心惊——信末署着一个名号：血煞教。\n萧逸，你已不是当初上山的那个少年了。且在山中好生修行，待你丹成之日，便是再启程之时。',
        actions: [{ do: 'completeQuest', id: 'quest_main_5' }],
        next: null,
      },
      offer1: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '你便是新来的外门弟子萧逸？老道观你骨骼清奇，剑心通明。\n眼下山道野狼为祸，香客苦不堪言——你且去清理一番，杀它五匹立威！',
        choices: [
          { text: '弟子领命！', next: 'offer1b', actions: [{ do: 'startQuest', id: 'quest_main_1' }] },
          { text: '容我先准备一下。', next: null },
        ],
      },
      offer1b: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '好！山道两侧的深草里便是狼群藏身之处。\n（在深草中走动会遭遇野狼，多备些回血丹。）',
        next: null,
      },
      progress1: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '狼患未除，切勿懈怠。山道深草之中多加巡视！',
        next: null,
      },
      turnin1: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '哦？狼患已平，好胆色！\n这颗「筑基丹」便赏了你——待你炼气圆满，凭它冲击筑基。',
        actions: [{ do: 'completeQuest', id: 'quest_main_1' }],
        next: 'after1',
      },
      after1: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '去吧，先去偏殿药圃找柳如烟师姐。她通晓医术符咒，让她随你同行。',
        next: null,
      },
      offer2: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '近日山东面的幽冥洞阴气翻涌，恐有妖物作祟。\n炼气之躯入洞凶多吉少——你先突破筑基，再邀柳师姐同行。',
        choices: [
          { text: '弟子明白！', next: null, actions: [{ do: 'startQuest', id: 'quest_main_2' }] },
        ],
      },
      progress2: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '',
        branch: [
          { cond: { ally: 'liu' }, next: 'progress2b' },
        ],
        next: 'progress2a',
      },
      progress2a: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '先去药圃邀柳如烟师姐同行，再设法突破筑基（在「角色」面板中使用筑基丹突破）。',
        next: null,
      },
      progress2b: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '柳师姐既已应下，你便安心冲击筑基吧。以你如今的修为，突破只是水到渠成。',
        next: null,
      },
      // 交付台词按柳如烟是否在队区分（玩家可能未经邀人直接复命）
      turnin2: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen', text: '',
        branch: [
          { cond: { ally: 'liu' }, next: 'turnin2a' },
        ],
        next: 'turnin2b',
      },
      turnin2a: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '筑基已成？！好，好！有如烟同行，老道放心。\n幽冥洞的禁制已为你开启——此去务必小心。',
        actions: [{ do: 'completeQuest', id: 'quest_main_2' }],
        next: 'after2',
      },
      turnin2b: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '筑基已成？！好，好！只是柳师姐还未与你同行——去药圃再邀一趟，洞中凶险，多个人多分照应。\n幽冥洞的禁制已为你开启——此去务必小心。',
        actions: [{ do: 'completeQuest', id: 'quest_main_2' }],
        next: 'after2',
      },
      after2: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '洞中邪祟非同小可。东面山崖后便是洞口，多备丹药，随时存档！',
        next: null,
      },
      offer3: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '探子来报：洞中邪祟的源头，是一位自称「幽冥老祖」的邪修。\n除掉他，还青云山一个太平——此战，只许胜！',
        choices: [
          { text: '若不除魔，誓不回山！', next: null, actions: [{ do: 'startQuest', id: 'quest_main_3' }] },
        ],
      },
      progress3: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '幽冥老祖就盘踞在洞窟深处。切勿轻敌，若觉不支便先退出洞来。',
        next: null,
      },
      turnin3: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '……好，好啊！妖氛已清，青云山重归太平。\n萧逸，你剑心通明，行事有度——此后江湖路远，好自为之。',
        actions: [{ do: 'completeQuest', id: 'quest_main_3' }],
        next: null,
      },
      default: {
        speaker: '掌门·玄阳子', portrait: 'face_zhangmen',
        text: '山下的妖物近来不太平，行走山道多加小心。',
        next: null,
      },
    },
  },

  dlg_liu: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '柳如烟', portrait: 'face_liu', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_2', state: 'ready' } }, next: 'turnin_s2' },
          { cond: { quest: { id: 'quest_side_2', state: 'active' } }, next: 'progress_s2' },
          // 主线 2 交付发生在与掌门对话时（notifyTalk 自动结算），
          // 故此处须同时接受 completed，否则复命后再来邀人将永久不可达
          { cond: { all: [{ any: [{ quest: { id: 'quest_main_2', state: 'active' } }, { quest: { id: 'quest_main_2', state: 'completed' } }] }, { flagAbsent: 'liu_joined' }] }, next: 'join' },
          { cond: { flag: 'liu_joined' }, next: 'joined_router' },
        ],
        next: 'before',
      },
      joined_router: {
        speaker: '柳如烟', portrait: 'face_liu', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_2', state: 'available' } }, next: 'offer_s2' },
        ],
        next: 'joined',
      },
      before: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '（白衫师姐正在药圃中晾晒草药）……外门的新面孔？我忙着呢，有事去找掌门。',
        next: null,
      },
      join: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '',
        choices: [
          { text: '师姐，掌门让我邀你同行，下山除妖。', next: 'join_yes', cond: { any: [{ quest: { id: 'quest_main_2', state: 'active' } }, { quest: { id: 'quest_main_2', state: 'completed' } }] } },
          { text: '师姐在忙什么？', next: 'busy' },
        ],
      },
      busy: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '晾晒草药，配制药丹。有空多读些医经，别光顾着舞剑。',
        next: null,
      },
      join_yes: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '幽冥洞？那地方阴气冲天……罢了，正好缺个试药的。\n你的伤我可不管包扎！',
        actions: [{ do: 'joinAlly', id: 'liu' }, { do: 'setFlag', flag: 'liu_joined' }],
        next: 'join_yes2',
      },
      join_yes2: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '（柳如烟加入了队伍！）\n战斗中我会用济世术为大家疗伤，别忘了给我配把好武器。',
        next: null,
      },
      joined: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '战斗时站在你身后就好。灵力见底时记得给我灵力丹。',
        next: null,
      },
      offer_s2: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '对了……我那页《青元诀》残页，前几日被山下偷灵狐叼走了。\n你若遇见那畜生，替我夺回来。',
        choices: [
          { text: '包在我身上。', next: null, actions: [{ do: 'startQuest', id: 'quest_side_2' }] },
          { text: '再说吧。', next: null },
        ],
      },
      progress_s2: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '',
        branch: [
          { cond: { item: { id: 'book_canpian', count: 1 } }, next: 'progress_s2b' },
        ],
        next: 'progress_s2a',
      },
      progress_s2a: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '残页多半还在妖狐窝里。那畜生跑得快，留神它的狐火。',
        next: null,
      },
      progress_s2b: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '咦，你身上有残页的气息！快给我看看——',
        next: null,
      },
      turnin_s2: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '就是这页！多谢。\n这颗筑基丹你收着，突破时防身要紧。',
        actions: [{ do: 'completeQuest', id: 'quest_side_2' }],
        next: null,
      },
    },
  },

  dlg_shangren: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '杂货商·钱掌柜', portrait: 'face_shangren', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_1', state: 'ready' } }, next: 'turnin' },
          { cond: { quest: { id: 'quest_side_1', state: 'active' } }, next: 'progress' },
          { cond: { quest: { id: 'quest_side_1', state: 'available' } }, next: 'offer' },
        ],
        next: 'hello',
      },
      hello: {
        speaker: '杂货商·钱掌柜', portrait: 'face_shangren',
        text: '客官要些什么？丹药器械，咱这儿虽小，样样齐全。',
        choices: [
          { text: '看看货物。', next: null, actions: [{ do: 'openShop', id: 'shop_qingyun' }] },
          { text: '只是路过。', next: null },
        ],
      },
      offer: {
        speaker: '杂货商·钱掌柜', portrait: 'face_shangren',
        text: '小哥是练家子吧？替我收三颗「狼牙」来——野狼身上就有，制药急需啊。\n事成之后，丹药银两绝不含糊！',
        choices: [
          { text: '成交。', next: null, actions: [{ do: 'startQuest', id: 'quest_side_1' }] },
          { text: '先看看别的。', next: 'hello' },
        ],
      },
      progress: {
        speaker: '杂货商·钱掌柜', portrait: 'face_shangren',
        text: '狼牙凑齐了吗？打狼的时候留神别被咬了。',
        choices: [
          { text: '看看货物。', next: null, actions: [{ do: 'openShop', id: 'shop_qingyun' }] },
          { text: '这就去。', next: null },
        ],
      },
      turnin: {
        speaker: '杂货商·钱掌柜', portrait: 'face_shangren',
        text: '好牙口！……呸，好狼牙！钱货两讫，这些丹药你拿好。',
        actions: [{ do: 'completeQuest', id: 'quest_side_1' }],
        next: 'turnin2',
      },
      turnin2: {
        speaker: '杂货商·钱掌柜', portrait: 'face_shangren',
        text: '以后要买丹药器械，随时来找我。',
        choices: [
          { text: '看看货物。', next: null, actions: [{ do: 'openShop', id: 'shop_qingyun' }] },
          { text: '告辞。', next: null },
        ],
      },
    },
  },

  dlg_dizi: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '门派弟子', portrait: 'face_dizi',
        text: '新来的？记好了：方向键走路，Z 键跟人搭话，X 键开菜单存档。',
        next: 'n2',
      },
      n2: {
        speaker: '门派弟子', portrait: 'face_dizi',
        text: '山下深草丛里有野狼，走着走着就会撞上——老弟子都管那叫「暗雷」。',
        next: null,
      },
    },
  },

  dlg_dizi2: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '练武弟子', portrait: 'face_dizi',
        text: '境界越高，气息越强。听说筑基之后，还能修成雷霆万钧的大神通！',
        next: null,
      },
    },
  },

  dlg_hunter: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '老猎户', portrait: 'face_hunter',
        text: '北边山道闹狼，后山深草更是凶险。走路看着点脚下的草——草越深，狼越大。',
        next: 'n2',
      },
      n2: {
        speaker: '老猎户', portrait: 'face_hunter',
        text: '山道东边有条岔道通落霞林，林子里猴蜂野猪都有，深处的熊罴和树精不好惹——想练本事，去那儿比守着山道强。',
        next: 'n3',
      },
      n3: {
        speaker: '老猎户', portrait: 'face_hunter',
        text: '过了落霞林再往南是惊鸿涧，涧里家伙更硬，没个十来级的本事别去。林子口秦婆的药酒方子倒是救过老朽一命，得空替她跑跑腿。',
        next: null,
      },
    },
  },

  dlg_yaogu: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '采药妪·秦婆', portrait: 'face_yaonong', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_11', state: 'ready' } }, next: 'turnin' },
          { cond: { quest: { id: 'quest_side_11', state: 'active' } }, next: 'progress' },
          { cond: { quest: { id: 'quest_side_11', state: 'available' } }, next: 'offer' },
        ],
        next: 'hello',
      },
      hello: {
        speaker: '采药妪·秦婆', portrait: 'face_yaonong',
        text: '老婆子守着这片林子采药。这些年妖物越来越多，采个药都得挑日头没落的时候……',
        next: null,
      },
      offer: {
        speaker: '采药妪·秦婆', portrait: 'face_yaonong',
        text: '林中妖猴前些日子抢了我的酒坛，如今倒自己酿起酒来了——那猴儿酿是泡药酒的引子，缺它不得。\n替我讨两坛回来，药钱分你。',
        choices: [
          { text: '老人家放心，交给我。', next: null, actions: [{ do: 'startQuest', id: 'quest_side_11' }] },
          { text: '我还有事在身。', next: 'hello' },
        ],
      },
      progress: {
        speaker: '采药妪·秦婆', portrait: 'face_yaonong',
        text: '妖猴爪子快，可架不住酒香。深草里的猴群最会藏酒，多转几圈总有。',
        next: null,
      },
      turnin: {
        speaker: '采药妪·秦婆', portrait: 'face_yaonong',
        text: '好酒！坛口泥封都还香着呢。这些丹药你拿去——往后常来林里坐坐。',
        actions: [{ do: 'completeQuest', id: 'quest_side_11' }],
        next: null,
      },
    },
  },

  dlg_xiangke: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '迷路香客', portrait: 'face_huolang',
        text: '这位侠士……我从北边上山进香，不想涧里雾大迷了路。这涧里的水猴子会拽人下水，披石壳的兽刀剑不入，你可千万当心。',
        next: 'n2',
      },
      n2: {
        speaker: '迷路香客', portrait: 'face_huolang',
        text: '东北边石崖上有个山洞，里头隐约有灵光……唔，供没供着山神我是不敢进去看的。你要有胆，里头兴许有好东西。',
        next: null,
      },
    },
  },

  dlg_boss_intro: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '？？？', portrait: 'face_boss',
        text: '何人擅闯幽冥洞？……哼，青云门的小崽子。',
        next: 'n2',
      },
      n2: {
        speaker: '幽冥老祖', portrait: 'face_boss',
        text: '来得正好。老夫的尸傀，还缺几副新鲜皮囊——',
        next: 'n3',
      },
      n3: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '妖人！青云山容不得你作祟——受死吧！',
        next: null,
      },
    },
  },

  dlg_hf_intro: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '？？？', portrait: 'face_heifeng',
        text: '好大的胆子，敢闯老子的聚义堂——青云门的小崽子？',
        next: 'n2',
      },
      n2: {
        speaker: '黑风王', portrait: 'face_heifeng',
        text: '幽冥老祖那老东西死了便死了，与老子何干？\n不过你既敢上门，就把命留下，给寨里补几口棺材！',
        next: 'n3',
      },
      n3: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '劫掠商旅、勾结邪修，血债累累——今日便替江湖除了你！',
        next: null,
      },
    },
  },

  dlg_huolang: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '落难货郎', portrait: 'face_huolang', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_3', state: 'ready' } }, next: 'turnin_s3' },
          { cond: { all: [{ quest: { id: 'quest_main_5', state: 'active' } }, { flagAbsent: 'hf_intel' }] }, next: 'intel' },
          { cond: { quest: { id: 'quest_main_5', state: 'active' } }, next: 'intel2' },
          { cond: { quest: { id: 'quest_side_3', state: 'active' } }, next: 'progress_s3' },
          { cond: { quest: { id: 'quest_side_3', state: 'available' } }, next: 'offer_s3' },
        ],
        next: 'hello',
      },
      hello: {
        speaker: '落难货郎', portrait: 'face_huolang',
        text: '（歪倒的货车旁，货郎正垂头丧气）……唉，本钱折光了哟。',
        next: null,
      },
      intel: {
        speaker: '落难货郎', portrait: 'face_huolang',
        text: '客官也是要过山口？听我一句：黑风寨三面绝壁，只有南面一座寨门，吊桥一拉谁也进不去——偏偏前日他们和寨里的邪术士闹翻了，吊桥才没拉。\n寨主黑风王，使一口九环大刀，帐下四大护法，个个不好惹。',
        actions: [{ do: 'setFlag', flag: 'hf_intel' }],
        next: 'intel2',
      },
      intel2: {
        speaker: '落难货郎', portrait: 'face_huolang',
        text: '对了……我的货担被他们的飞贼劫散了，贼赃撒了一路。客官若顺路替我拾回几件，定有重谢！',
        next: null,
      },
      offer_s3: {
        speaker: '落难货郎', portrait: 'face_huolang',
        text: '小哥是练家子吧？替我拾回三件贼赃可好？飞贼身上就带着，我找找还有救。',
        choices: [
          { text: '举手之劳。', next: null, actions: [{ do: 'startQuest', id: 'quest_side_3' }] },
          { text: '自顾不暇，恕难从命。', next: null },
        ],
      },
      progress_s3: {
        speaker: '落难货郎', portrait: 'face_huolang',
        text: '贼赃可有着落了？飞贼跑得快，刀子更快，客官留神。',
        next: null,
      },
      turnin_s3: {
        speaker: '落难货郎', portrait: 'face_huolang',
        text: '哈！我的家当回来了！客官高义，这些银钱丹药你务必收下——',
        actions: [{ do: 'completeQuest', id: 'quest_side_3' }],
        next: 'turnin_s3b',
      },
      turnin_s3b: {
        speaker: '落难货郎', portrait: 'face_huolang',
        text: '日后客官若从西山商路过，报我名号，各处店饭钱折半！',
        next: null,
      },
    },
  },

  dlg_luo: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '洛清霜', portrait: 'face_luo', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_4', state: 'ready' } }, next: 'turnin_s4' },
          { cond: { quest: { id: 'quest_side_4', state: 'active' } }, next: 'progress_s4' },
          { cond: { all: [{ any: [{ quest: { id: 'quest_main_5', state: 'active' } }, { quest: { id: 'quest_main_5', state: 'ready' } }, { quest: { id: 'quest_main_5', state: 'completed' } }] }, { flagAbsent: 'luo_joined' }] }, next: 'join' },
          { cond: { flag: 'luo_joined' }, next: 'joined_router' },
        ],
        next: 'before',
      },
      before: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '（白衣女子负刀而立，周身寒气凛冽）……站住。再往前一步，休怪刀下无情。',
        next: null,
      },
      join: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '',
        choices: [
          { text: '姑娘也要闯黑风寨？不如同行。', next: 'join_yes' },
          { text: '（退让一边）', next: 'decline' },
        ],
      },
      decline: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '（她不再看你，目光如刀锋般扫向西山方向。）',
        next: null,
      },
      join_yes: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '同行？……也罢。黑风王欠我洛家一笔血债，你取他的首级，我取他的——命。路上各行其是，互不相欠。',
        actions: [{ do: 'joinAlly', id: 'luo' }, { do: 'setFlag', flag: 'luo_joined' }],
        next: 'join_yes2',
      },
      join_yes2: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '（洛清霜加入了队伍！）\n我的刀比你的剑快。打架时，你站我身后。',
        next: null,
      },
      joined_router: {
        speaker: '洛清霜', portrait: 'face_luo', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_6', state: 'ready' } }, next: 'turnin_s6' },
          { cond: { quest: { id: 'quest_side_6', state: 'active' } }, next: 'progress_s6' },
          { cond: { quest: { id: 'quest_side_4', state: 'available' } }, next: 'offer_s4' },
          { cond: { quest: { id: 'quest_side_6', state: 'available' } }, next: 'offer_s6' },
        ],
        next: 'joined',
      },
      joined: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '血煞教既与黑风寨有旧，那笔账，正好一并算清。',
        next: null,
      },
      offer_s6: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '谷底的煞傀体内，凝着一种「玄晶」——是铸刀的至纯之材。\n你若替我寻来三枚，洛家的刀，就能真正出鞘。',
        choices: [
          { text: '玄晶的事，包在我身上。', next: null, actions: [{ do: 'startQuest', id: 'quest_side_6' }] },
          { text: '先了结眼前的事。', next: null },
        ],
      },
      progress_s6: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '',
        branch: [
          { cond: { item: { id: 'xuan_jing', count: 3 } }, next: 'progress_s6b' },
        ],
        next: 'progress_s6a',
      },
      progress_s6a: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '玄晶在煞傀体内。那东西皮糙肉厚，用碎石的功夫打它便是。',
        next: null,
      },
      progress_s6b: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '玄晶的气息……都在你身上。给我吧。',
        next: null,
      },
      turnin_s6: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '三枚玄晶，成色上佳。铸刀之火，我已备好——\n（她以玄晶重铸了家传宝刀，刀成之日，寒光凛冽）\n这柄「怒江刀」，你先拿着。等血煞事了，再还我不迟。',
        actions: [{ do: 'completeQuest', id: 'quest_side_6' }],
        next: null,
      },
      offer_s4: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '寨中武库锁着我洛家的《怒江刀谱》，是黑风王当年血洗洛家坞时劫走的。\n你若替我取回……大恩不言谢。',
        choices: [
          { text: '刀谱的事，包在我身上。', next: null, actions: [{ do: 'startQuest', id: 'quest_side_4' }] },
          { text: '先了结眼前的事。', next: null },
        ],
      },
      progress_s4: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '',
        branch: [
          { cond: { item: { id: 'dao_pu', count: 1 } }, next: 'progress_s4b' },
        ],
        next: 'progress_s4a',
      },
      progress_s4a: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '刀谱就在寨中武库里。踏平黑风寨之后，替我走一趟。',
        next: null,
      },
      progress_s4b: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '……你身上有刀谱的气息。给我。',
        next: null,
      },
      turnin_s4: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '（她接过刀谱，指尖微微发颤，良久才开口。）\n洛家满门的仇，今日算讨回一半。这枚御灵铃你收着——是他留给我的，我不需要了。',
        actions: [{ do: 'completeQuest', id: 'quest_side_4' }],
        next: null,
      },
    },
  },

  dlg_yaonong: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '采药人', portrait: 'face_yaonong', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_5', state: 'ready' } }, next: 'turnin_s5' },
          { cond: { quest: { id: 'quest_side_5', state: 'active' } }, next: 'progress_s5' },
          { cond: { all: [{ quest: { id: 'quest_main_7', state: 'active' } }, { flagAbsent: 'xsg_intel' }] }, next: 'intel' },
          { cond: { quest: { id: 'quest_main_7', state: 'active' } }, next: 'intel2' },
          { cond: { quest: { id: 'quest_side_5', state: 'available' } }, next: 'offer_s5' },
        ],
        next: 'hello',
      },
      hello: {
        speaker: '采药人', portrait: 'face_yaonong',
        text: '（鬓发霜白的老人背着药篓，正在石缝间采药）……嘘，轻声。谷里的东西，听得到人声。',
        next: null,
      },
      intel: {
        speaker: '采药人', portrait: 'face_yaonong',
        text: '老朽在谷里住了四十年，眼看它从荒谷变成魔窟。\n血煞教在谷底筑了祭坛，坛主自称「血煞教主」——每逢月晦便开坛血祭，山外失踪的人口，十有八九是落进了这里。',
        actions: [{ do: 'setFlag', flag: 'xsg_intel' }],
        next: 'intel2',
      },
      intel2: {
        speaker: '采药人', portrait: 'face_yaonong',
        text: '北面谷口的左使不好惹，那是个把人命当药引子的魔头。\n对了——谷中妖物体内多凝有「血煞珠」，既是魔物凭证，也可入药。老朽配药正缺几枚，你若顺手……',
        next: null,
      },
      offer_s5: {
        speaker: '采药人', portrait: 'face_yaonong',
        text: '替老朽收四枚血煞珠可好？谷中教徒、血姬身上都有。老朽以九转丹相谢——那是能救命的丹药。',
        choices: [
          { text: '老人家放心。', next: null, actions: [{ do: 'startQuest', id: 'quest_side_5' }] },
          { text: '自顾不暇，恕难从命。', next: null },
        ],
      },
      progress_s5: {
        speaker: '采药人', portrait: 'face_yaonong',
        text: '血煞珠凑够四枚了吗？拿珠子时留神血姬——她的血祭，沾上便烧。',
        next: null,
      },
      turnin_s5: {
        speaker: '采药人', portrait: 'face_yaonong',
        text: '好珠子……有这四枚，老朽的药就能护住谷口几个村子的平安。\n九转丹你收好，入坛之前，说不定能救你一命。',
        actions: [{ do: 'completeQuest', id: 'quest_side_5' }],
        next: null,
      },
    },
  },

  dlg_zuoshi_intro: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '？？？', portrait: 'face_xuesha',
        text: '谷口血灯三盏，今夜有客——青云门的？教主念了你们好久了。',
        next: 'n2',
      },
      n2: {
        speaker: '血煞左使', portrait: 'face_xuesha',
        text: '幽冥老祖、黑风王，都是废物。他们的血不配入坛——\n你们三个的，勉强够一炉。',
        next: 'n3',
      },
      n3: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '血债累累，还想拉人垫背——今日便先断了你这条臂膀！',
        next: null,
      },
    },
  },

  dlg_xuesha_intro: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '？？？', portrait: 'face_xuesha',
        text: '（血池翻涌，一道身影自血浪中缓缓立起）……青云门。\n百年了，正道的狗鼻子，还是这么灵。',
        next: 'n2',
      },
      n2: {
        speaker: '血煞教主', portrait: 'face_xuesha',
        text: '幽冥老祖借老夫的煞气，黑风王替老夫敛财——如今皆成枯骨。\n也罢，就取你们三人的金丹元婴，为老夫的开坛大典……祭旗！',
        next: 'n3',
      },
      n3: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '以苍生血肉证你邪道——血煞一脉，今日就此断绝！\n诸位，并肩子上！',
        next: null,
      },
    },
  },

  dlg_wuji: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '', text: '血煞教主溃散的刹那，漫天血雾忽然逆流，尽数涌向萧逸眉心——', next: 'n2' },
      n2: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '（识海之中，剑鸣如龙。以杀止杀，是为护生——这一剑，问心无愧！）\n啊————',
        actions: [{ do: 'storyBreakthrough' }],
        next: 'n3',
      },
      n3: {
        speaker: '', text: '（气机轰然贯通，婴儿般的元神自萧逸眉间一闪而没——元婴，成了。）\n柳如烟：这个气息……元婴期！萧逸，你……\n洛清霜：……怪物。', next: 'n4' },
      n4: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '（大梁境内，再无血煞之患。可教主临终的狂笑犹在耳边——「血煞之上，另有其人」……）\n下山吧。有些名字，总要有人去查个水落石出。',
        next: null,
      },
    },
  },

  dlg_cunzhang: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang', text: '',
        branch: [
          { cond: { quest: { id: 'quest_main_11', state: 'ready' } }, next: 'turnin11' },
          { cond: { quest: { id: 'quest_main_11', state: 'active' } }, next: 'progress11' },
          { cond: { quest: { id: 'quest_main_11', state: 'available' } }, next: 'offer11' },
          { cond: { quest: { id: 'quest_main_10', state: 'ready' } }, next: 'turnin10' },
          { cond: { quest: { id: 'quest_main_10', state: 'active' } }, next: 'progress10' },
          { cond: { quest: { id: 'quest_main_10', state: 'available' } }, next: 'offer10' },
          { cond: { quest: { id: 'quest_main_9', state: 'ready' } }, next: 'turnin9' },
          { cond: { quest: { id: 'quest_main_9', state: 'active' } }, next: 'progress9' },
          { cond: { quest: { id: 'quest_main_9', state: 'available' } }, next: 'offer9' },
        ],
        next: 'hello',
      },
      hello: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '（老人佝偻着背，望着渡口以北的风雪）……客人从南边来？南边……还有太平日子吗？',
        next: null,
      },
      offer9: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '客人身上的煞气……你是除了血煞教主的恩人！\n不瞒您说：渡口被雪魈围了半个月，商路断了，柴米都进不来。北面——北面还有更邪性的东西。',
        choices: [
          { text: '老爹放心，交给我。', next: 'offer9b', actions: [{ do: 'startQuest', id: 'quest_main_9' }, { do: 'setFlag', flag: 'bingyuan_open' }] },
          { text: '容我先准备一下。', next: null },
        ],
      },
      offer9b: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '雪魈就窝在北面冰原的雪窝里。对了——渡口还来了位背琴的先生，说是专为魔气而来，客官或许该会会他。',
        next: null,
      },
      progress9: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '雪魈不退，渡口不宁。冰原的深雪里，多加当心。',
        // 兼容旧存档：任务已接但旗标未设（修复前的卡死存档），再访村正补开北门
        actions: [{ do: 'setFlag', flag: 'bingyuan_open' }],
        next: null,
      },
      turnin9: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '雪魈退了！好，好！北面的路老爹给你开——只是记住：冰原尽头是魔渊，千年前祖师爷用命封的魔窟。\n没化神的修为，进了就是送死。',
        actions: [{ do: 'completeQuest', id: 'quest_main_9' }, { do: 'setFlag', flag: 'bingyuan_open' }],
        next: 'turnin9b',
      },
      turnin9b: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '这颗破境丹是渡口几代人攒下的镇村之宝——如今，它该跟着该去的人走。',
        next: null,
      },
      offer10: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '冰原隘口有魔物镇守，那是个大家伙。除掉它，再破化神——魔渊的门，老爹替你推开。',
        choices: [
          { text: '晚辈领命。', next: null, actions: [{ do: 'startQuest', id: 'quest_main_10' }] },
          { text: '容我先准备一下。', next: null },
        ],
      },
      progress10: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '',
        branch: [
          { cond: { realm: 'huashen' }, next: 'progress10b' },
        ],
        next: 'progress10a',
      },
      progress10a: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '化神未成，莫入魔渊。（以破境丹冲击化神——五十%的天资，也得看命数。）',
        next: null,
      },
      progress10b: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '化神……化神了！老爹活了七十年，头一回见着化神修士。\n去罢，把那千年的祸根，连根拔了！',
        next: null,
      },
      turnin10: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '魔将已诛，化神已成——魔渊的封印，老爹这就为你们开。\n（老人自怀中取出一块古玉，按上渡口北的石碑，冰原尽头轰然洞开）',
        actions: [{ do: 'completeQuest', id: 'quest_main_10' }],
        next: 'turnin10b',
      },
      turnin10b: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '孩子们……若是有去无回，老爹给你们立长生牌位。\n若是回得来——老爹给你们温一壶最烈的酒。',
        next: null,
      },
      offer11: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '魔渊已开。千年的恩怨，就在渊底做个了断——去吧，孩子们。',
        choices: [
          { text: '此去，必不回望。', next: null, actions: [{ do: 'startQuest', id: 'quest_main_11' }] },
        ],
      },
      progress11: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '渊底的魔主……千年前，青云门祖师以性命封祂于此。\n如今，轮到你们了。',
        next: null,
      },
      turnin11: {
        speaker: '渡口村正·赵老爹', portrait: 'face_cunzhang',
        text: '回来了……都回来了！哈哈哈哈——魔主既灭，封印重铸，北境百年无虞！\n酒，老爹给你们温好了！这杯，敬青云，敬故人，敬天下太平！',
        actions: [{ do: 'completeQuest', id: 'quest_main_11' }],
        next: null,
      },
    },
  },

  dlg_laoban: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '渡口商人·孙掌柜', portrait: 'face_laoban', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_7', state: 'ready' } }, next: 'turnin_s7' },
          { cond: { quest: { id: 'quest_side_7', state: 'active' } }, next: 'progress_s7' },
          { cond: { quest: { id: 'quest_side_7', state: 'available' } }, next: 'offer_s7' },
        ],
        next: 'hello',
      },
      hello: {
        speaker: '渡口商人·孙掌柜', portrait: 'face_laoban',
        text: '客官要点什么？北地的规矩：丹药管够，价钱公道！',
        choices: [
          { text: '看看货物。', next: null, actions: [{ do: 'openShop', id: 'shop_hanshidu' }] },
          { text: '只是看看。', next: null },
        ],
      },
      offer_s7: {
        speaker: '渡口商人·孙掌柜', portrait: 'face_laoban',
        text: '客官若往冰原去，替我采五朵「冰莲」可好？渡口过冬的固元丹，全指着它做主药。',
        choices: [
          { text: '顺路之事，包在我身上。', next: null, actions: [{ do: 'startQuest', id: 'quest_side_7' }] },
          { text: '先看看货物。', next: 'hello' },
        ],
      },
      progress_s7: {
        speaker: '渡口商人·孙掌柜', portrait: 'face_laoban',
        text: '冰莲凑够五朵了吗？雪魈窝里最多——小心它们的爪子。',
        next: null,
      },
      turnin_s7: {
        speaker: '渡口商人·孙掌柜', portrait: 'face_laoban',
        text: '好莲！好莲！这批固元丹，头一份儿就敬客官——以后北地的丹药，孙某给您留最上等的！',
        actions: [{ do: 'completeQuest', id: 'quest_side_7' }],
        next: 'turnin_s7b',
      },
      turnin_s7b: {
        speaker: '渡口商人·孙掌柜', portrait: 'face_laoban',
        text: '要买丹药器械，随时来孙某这儿。',
        choices: [
          { text: '看看货物。', next: null, actions: [{ do: 'openShop', id: 'shop_hanshidu' }] },
          { text: '告辞。', next: null },
        ],
      },
    },
  },

  dlg_shen: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '沈孤鸿', portrait: 'face_shen', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_8', state: 'ready' } }, next: 'turnin_s8' },
          { cond: { quest: { id: 'quest_side_8', state: 'active' } }, next: 'progress_s8' },
          { cond: { all: [{ quest: { id: 'quest_main_9', state: 'active' } }, { flagAbsent: 'shen_joined' }] }, next: 'join' },
          { cond: { flag: 'shen_joined' }, next: 'joined_router' },
        ],
        next: 'before',
      },
      before: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '（白衣琴师坐于冰潭之畔，十指搭弦，未发一音）……再走近半步，琴音便是刀音。',
        next: null,
      },
      join: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '',
        choices: [
          { text: '先生为魔气而来？不如同行。', next: 'join_yes' },
          { text: '（退让一边）', next: 'decline' },
        ],
      },
      decline: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '（他不再看你，指尖轻拨，冰潭应声而裂。）',
        next: null,
      },
      join_yes: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '魔渊底下的东西，毁过我的师门。我找它找了十年。\n同行可以——但到了渊底，那一剑，得留给我。',
        actions: [{ do: 'joinAlly', id: 'shen' }, { do: 'setFlag', flag: 'shen_joined' }],
        next: 'join_yes2',
      },
      join_yes2: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '（沈孤鸿加入了队伍！）\n我的琴音可安军心，可破魔胆。诸位——调琴，备曲。',
        next: null,
      },
      joined_router: {
        speaker: '沈孤鸿', portrait: 'face_shen', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_8', state: 'available' } }, next: 'offer_s8' },
        ],
        next: 'joined',
      },
      joined: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '魔渊近在眼前。夜里安心睡——有我在，魇祟不近身。',
        next: null,
      },
      offer_s8: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '渊中魔物溃散之处，会留下「魔魂碎片」——那是我焦尾琴失落十年的琴魂。\n你若替我寻回三片，此琴重鸣之日，必有厚报。',
        choices: [
          { text: '琴魂的事，包在我身上。', next: null, actions: [{ do: 'startQuest', id: 'quest_side_8' }] },
          { text: '先了结眼前的事。', next: null },
        ],
      },
      progress_s8: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '',
        branch: [
          { cond: { item: { id: 'mo_hun', count: 3 } }, next: 'progress_s8b' },
        ],
        next: 'progress_s8a',
      },
      progress_s8a: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '魔魂碎片在渊魔身上。近渊者心神不宁——诸位，把稳心神。',
        next: null,
      },
      progress_s8b: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '琴魂在鸣……它们在你身上。给我。',
        next: null,
      },
      turnin_s8: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '（他以魔魂碎片续上琴弦，焦尾琴龙吟一声，余音三日不绝）\n十年了……琴魂归位。此琴此后与诸位共进退——渊底再见分晓。',
        actions: [{ do: 'completeQuest', id: 'quest_side_8' }],
        next: null,
      },
    },
  },

  dlg_yuanmojiang_intro: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '？？？', portrait: 'face_xuanming',
        text: '（风雪骤停。一道魔影自冰雾里直起，足有两人多高）……活人的味道。',
        next: 'n2',
      },
      n2: {
        speaker: '渊魔将', portrait: 'face_xuanming',
        text: '主人说了，金丹以上的，留着；化神以下的，吃了。\n你们……很香。',
        next: 'n3',
      },
      n3: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '魔物挡路——碎它！',
        next: null,
      },
    },
  },

  dlg_xuanming_intro: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '？？？', portrait: 'face_xuanming',
        text: '（渊底无风，血色的雾却向两侧分开——一道身影坐在千年封印的残碑上，似睡非睡）\n……来了。',
        next: 'n2',
      },
      n2: {
        speaker: '魔主·玄冥', portrait: 'face_xuanming',
        text: '幽冥、黑风、血煞……都是老夫撒出去的种子。尔等除一株，老夫便再种一株。\n千年了，正道养出的刀，总算够锋利了——来，让老夫看看，这一茬，能接几招。',
        next: 'n3',
      },
      n3: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '千年血债，今日清偿。诸位——与我并剑，斩此獠！',
        next: null,
      },
    },
  },

  dlg_ending: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '', text: '魔主溃散的刹那，渊底的黑暗如潮水退去。\n千年前祖师刻下的封印残纹，在四人的灵力汇聚下，一点、一点，重新亮起——', next: 'n2' },
      n2: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '「以吾辈之名，重铸封印——魔渊永闭，佑北境百年。」\n（四道灵光没入石碑，轰鸣声里，渊底透进第一缕天光。）',
        next: 'n3',
      },
      n3: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '（长长舒了口气，坐倒在石阶上）……回青云门吧。我想喝一碗真正的热茶。',
        next: 'n4',
      },
      n4: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '（她把重铸的怒江刀负上背，望了望天光）……嗯。这次，我请。',
        next: 'n5',
      },
      n5: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '（他抚过新续的琴弦，微笑）当为一曲，贺天下太平。曲名——「归途」。',
        next: 'n6',
      },
      n6: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '（少年从青云山走来，一路斩妖除魔，终成天下景仰的化神剑修。）\n「走吧——回家。」',
        next: null,
      },
    },
  },

  // ---- 第五章：血煞之上 ----
  dlg_guchen: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '守塔人·古尘', portrait: '', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_9', state: 'ready' } }, next: 'turnin9' },
          { cond: { quest: { id: 'quest_side_9', state: 'active' } }, next: 'progress9' },
          { cond: { quest: { id: 'quest_side_9', state: 'available' } }, next: 'offer9' },
          { cond: { quest: { id: 'quest_side_9', state: 'completed' } }, next: 'praise' },
          { cond: { quest: { id: 'quest_main_9', state: 'completed' } }, next: 'idle' },
        ],
        next: 'locked',
      },
      locked: {
        speaker: '守塔人·古尘', portrait: '',
        text: '（守塔人眯着眼打量你，摇了摇头）塔门只为渡过北境生死之人而开。\n「北边的债了了，再来敲这扇门。」',
        next: null,
      },
      offer9: {
        speaker: '守塔人·古尘', portrait: '',
        text: '（守塔人推开塔门的石闩）「贫道古尘，守此塔一甲子。塔中幻境，重演旧敌——九层，一层凶过一层。」\n「登顶者，塔顶之物相赠。敢去么？」',
        choices: [
          { text: '九层便九层！', next: 'offer9b', actions: [{ do: 'startQuest', id: 'quest_side_9' }] },
          { text: '改日再来。', next: null },
        ],
      },
      offer9b: {
        speaker: '守塔人·古尘', portrait: '',
        text: '「塔中不得还童，出塔的石门就在每层脚下。记住——幻境里的敌人，死过一次了，不会再怕。」',
        next: null,
      },
      progress9: {
        speaker: '守塔人·古尘', portrait: '',
        text: '「塔顶的傀儡，是当年铸塔祖师以整座山的石魂所塑。莫要轻敌。」',
        next: null,
      },
      turnin9: {
        speaker: '守塔人·古尘', portrait: '',
        text: '（守塔人抚掌而笑）「一甲子了……总算等到一个登顶的人。」\n「此佩名虚空，乃铸塔祖师遗物——从今日起，它是你的了。」',
        actions: [{ do: 'completeQuest', id: 'quest_side_9' }],
        next: null,
      },
      praise: {
        speaker: '守塔人·古尘', portrait: '',
        text: '「塔还是那座塔，登塔的人，已经不是当年的人了。」\n（古尘微笑着，慢慢闭上了眼睛。）',
        next: null,
      },
      idle: {
        speaker: '守塔人·古尘', portrait: '',
        text: '「塔门已为你开。九层幻境，旧敌重演——敢登么？」',
        choices: [
          { text: '登塔！', next: null, actions: [{ do: 'startQuest', id: 'quest_side_9' }] },
          { text: '改日再来。', next: null },
        ],
      },
    },
  },

  dlg_qiuju: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '囚徒·鲁铸', portrait: '', text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_10', state: 'ready' } }, next: 'turnin10' },
          { cond: { quest: { id: 'quest_side_10', state: 'active' } }, next: 'progress10' },
          { cond: { quest: { id: 'quest_side_10', state: 'available' } }, next: 'offer10' },
          { cond: { quest: { id: 'quest_side_10', state: 'completed' } }, next: 'thanks' },
        ],
        next: 'captive',
      },
      captive: {
        speaker: '囚徒·鲁铸', portrait: '',
        text: '（窟角蜷着一个衣衫褴褛的汉子，腕上铁链锈迹斑斑）\n「……活人？是活人！小老儿鲁铸，原是山下铸剑匠，被这些赤衣邪徒掳来烧火炼丹……」',
        next: null,
      },
      offer10: {
        speaker: '囚徒·鲁铸', portrait: '',
        text: '「恩人在上！窟中赤焰蝠翼上的火翎，是铸剑人梦寐以求的淬火之材。」\n「若得三根，小老儿助你淬一口问天的剑——祖上传的手艺，绝不有辱剑名！」',
        choices: [
          { text: '三根火翎，包在我身上。', next: 'offer10b', actions: [{ do: 'startQuest', id: 'quest_side_10' }] },
          { text: '先躲好，莫声张。', next: null },
        ],
      },
      offer10b: {
        speaker: '囚徒·鲁铸', portrait: '',
        text: '「赤焰蝠怕寒怕水，诸位刀客的霜气最克它们——猎吧，猎吧！」',
        next: null,
      },
      progress10: {
        speaker: '囚徒·鲁铸', portrait: '',
        text: '「还差些火翎……它们就在窟中飞，火上浇油似的红。」',
        next: null,
      },
      turnin10: {
        speaker: '囚徒·鲁铸', portrait: '',
        text: '（鲁铸以血符引火，将火翎一层层淬入剑脊，剑身竟透出赤金之色）\n「成了！好剑气……恩人，这几枚丹药你收好——是我在丹房偷学的方子，救命用的！」',
        actions: [{ do: 'completeQuest', id: 'quest_side_10' }],
        next: null,
      },
      thanks: {
        speaker: '囚徒·鲁铸', portrait: '',
        text: '「等窟里清净了，小老儿就回山下重开炉灶——第一口剑，必以恩人姓名为铭！」',
        next: null,
      },
    },
  },

  dlg_tower_illusion: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '', text: '（石阶尽头，血雾骤起——一个熟悉的身影自雾中走出，眉目狰狞如旧。）', next: 'n2' },
      n2: {
        speaker: '？？？', text: '「血煞千年……香火不绝……」\n（是幻象，还是回声？唯有拔剑，方知真假。）', next: null },
    },
  },

  dlg_takui_intro: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '', text: '（塔顶尘埃簌簌而落——盘踞千年的石傀缓缓抬起头，石眼中的灵光如炬。）', next: 'n2' },
      n2: {
        speaker: '守塔傀儡', text: '「九层……已毕。往后……是第十层。」\n（它抬起石拳——原来塔顶的试炼，是它本身。）', next: null },
    },
  },

  dlg_chiyuan_intro: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '', text: '（幻境之门在身后合拢。眼前是一片血色的天——血月悬顶，赤柱擎天，天地间静得只剩心跳。）', next: 'n2' },
      n2: {
        speaker: '', text: '（血雾深处，缓缓立起一道影。祂的身形与凡人无异，可祂睁眼的刹那，整片幻境的血都在沸腾。）', next: 'n3' },
      n3: {
        speaker: '血煞之上·赤渊', portrait: 'face_xuesha',
        text: '「玄冥败了？……也好。千年的棋子，总有磨损的一日。」\n「小家伙，你可知你脚下的幻境，是用多少修士的血养出来的？——你是第一万三千个走进来的。」',
        next: 'n4',
      },
      n4: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '「血煞教是你放的线，魔主是你养的刀，北境的百年血债，也是你递的刀。」\n「今日我不问你修了多少年——我只问：你的血，够不够偿？」',
        next: 'n5',
      },
      n5: {
        speaker: '血煞之上·赤渊', portrait: 'face_xuesha',
        text: '「……有趣。那就让我看看——是千年血祭养出的我硬，还是你这万中无一的天问硬。」\n（祂抬手，整片血色天空倾轧而下——）',
        next: null,
      },
    },
  },

  dlg_trueend: {
    entry: 'n1',
    nodes: {
      n1: {
        speaker: '', text: '（赤渊溃散的刹那，血色的天空如镜面寸寸碎裂——\n碎镜之后，是漫天星河。）', next: 'n2' },
      n2: {
        speaker: '柳如烟', portrait: 'face_liu',
        text: '（她望着星河，轻声）「原来……煞天幻境的出口，就是天上。」',
        next: 'n3',
      },
      n3: {
        speaker: '洛清霜', portrait: 'face_luo',
        text: '（她收刀入鞘，刀上霜气未散）「千年血债，今日收账完毕。……都愣着做什么，回家。」',
        next: 'n4',
      },
      n4: {
        speaker: '沈孤鸿', portrait: 'face_shen',
        text: '（他端坐碎镜之上，拨响了最后一弦）「此曲无题——千年恩怨尽处，一声希声。」',
        next: 'n5',
      },
      n5: {
        speaker: '萧逸', portrait: 'face_hero',
        text: '（萧逸提剑而立，血符在掌心化为齑粉，随星河落下。）\n「魔也好，神也好——欠这世道的，一笔都不能少。」\n「走吧。回去喝茶。」',
        next: null,
      },
    },
  },

  // ---- 室内建筑互动 NPC ----
  dlg_zhike: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '知客弟子', portrait: 'face_dizi',
        text: '大殿乃清净之地，这位师弟还请放缓脚步，莫要喧哗。',
        choices: [
          { text: '想借蒲团打坐调息片刻。', next: 'rest' },
          { text: '告辞。', next: null },
        ],
      },
      rest: {
        speaker: '知客弟子', portrait: 'face_dizi',
        text: '东侧的蒲团常年沐着殿中灵气，最是灵验。\n……你盘膝而坐，灵息沉入丹田，气血周流，浑身舒畅。',
        actions: [{ do: 'healFull' }],
        next: null,
      },
    },
  },

  dlg_cangjing: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '阁老', portrait: 'face_yaonong',
        text: '藏经阁三百卷，吐纳、剑诀、拳谱无不齐备。只是——看得懂是缘分，看不懂，是命数。',
        next: 'n2',
      },
      n2: {
        speaker: '阁老', portrait: 'face_yaonong',
        text: '老夫观你根骨不错，赠你一句：境界之道如筑高台，根基不稳，登得再高也要塌。\n（服用丹药冲击境界，可在「角色」页进行。）',
        next: null,
      },
    },
  },

  dlg_cunfu: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '张嫂', portrait: 'face_cunv',
        text: '',
        branch: [
          { cond: { flagAbsent: 'gift_cunfu' }, next: 'first' },
        ],
        next: 'again',
      },
      first: {
        speaker: '张嫂', portrait: 'face_cunv',
        text: '外头那个闷葫芦是我家当家的，打了一辈子猎。近年山里狼群闹得凶，他的箭都快不够使了。\n这颗回血丹你拿着——进山莫逞强，可记住了。',
        actions: [{ do: 'giveItem', id: 'pill_huixue', count: 1 }, { do: 'setFlag', flag: 'gift_cunfu' }],
        next: null,
      },
      again: {
        speaker: '张嫂', portrait: 'face_cunv',
        text: '当家的又跟采药妪讨酒喝去了……真拿他没办法。',
        next: null,
      },
    },
  },

  dlg_laobo: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '赵老伯', portrait: 'face_laobo',
        text: '老汉在山下住了六十年。早年妖物哪敢这般靠近村落？这两年……唉，世道变了。',
        next: 'n2',
      },
      n2: {
        speaker: '赵老伯', portrait: 'face_laobo',
        text: '后生，听说山上仙人正收弟子。你若能拜入青云门学些真本事，可别忘了乡里乡亲。',
        next: null,
      },
    },
  },

  dlg_yaotong: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '药童', portrait: 'face_dizi',
        text: '',
        branch: [
          { cond: { quest: { id: 'quest_side_11', state: 'active' } }, next: 'progress' },
          { cond: { quest: { id: 'quest_side_11', state: 'completed' } }, next: 'done' },
        ],
        next: 'idle',
      },
      idle: {
        speaker: '药童', portrait: 'face_dizi',
        text: '秦婆婆在林子里采药，让我看家。她那手药酒可神了——就是酒引子老是缺。',
        next: null,
      },
      progress: {
        speaker: '药童', portrait: 'face_dizi',
        text: '婆婆念叨的猴儿酿还没找齐吗？妖猴群聚的地方，酒香能飘出二里地。',
        next: null,
      },
      done: {
        speaker: '药童', portrait: 'face_dizi',
        text: '婆婆泡上了新药酒，满屋子都是药香。她说等腿脚利索了，要亲自谢你。',
        next: null,
      },
    },
  },

  dlg_xiaoer: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '店小二', portrait: 'face_xiaoer',
        text: '客官里边请！本店虽小，酒是陈的，被褥是干净的，北边来的客人都夸！',
        choices: [
          { text: '开一间房，歇息一晚。', next: 'rest' },
          { text: '只打尖，不住店。', next: 'food' },
          { text: '扰了。', next: null },
        ],
      },
      rest: {
        speaker: '',
        text: '……一夜无话。窗外渡口水声潺潺，你睡了个难得的好觉。',
        actions: [{ do: 'healFull' }],
        next: null,
      },
      food: {
        speaker: '店小二', portrait: 'face_xiaoer',
        text: '好嘞——两斤酱牛肉一壶热酒，客官慢用！',
        next: null,
      },
    },
  },

  dlg_xuetu: {
    entry: 'root',
    nodes: {
      root: {
        speaker: '铺伙计', portrait: 'face_shangren',
        text: '客官想看点什么？掌柜的进货去了，小的也能做主！',
        choices: [
          { text: '看看货物。', next: null, actions: [{ do: 'openShop', id: 'shop_zahuopu' }] },
          { text: '随便逛逛。', next: null },
        ],
      },
    },
  },
};

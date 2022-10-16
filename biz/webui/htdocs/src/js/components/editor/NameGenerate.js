class NameGenerate {
  constructor() {
    this.nameCode = '鑫正涵琛妍芸露楠薇锦彤采初美冬婧桐莲彩洁'
      + '呈菡怡冰雯雪茜优静萱林馨鹤梅娜璐曼彬芳颖韵曦蔚桂月梦琪蕾'
      + '依碧枫欣杉丽祥雅欢婷舒心紫芙慧梓香玥菲璟茹昭岚玲云华阳弦'
      + '莉明珊雨蓓旭钰柔敏家凡花媛歆沛姿妮珍琬彦倩玉柏橘昕桃栀克'
      + '帆俊惠漫芝寒诗春淑凌珠灵可格璇函晨嘉鸿瑶帛琳文洲娅霞颜康'
      + '卓星礼远帝裕腾震骏加强运杞良梁逸禧辰佳子栋博年振荣国钊喆'
      + '睿泽允邦骞哲皓晖福濡佑然升树祯贤成槐锐芃驰凯韦信宇鹏盛晓'
      + '翰海休浩诚辞轩奇潍烁勇铭平瑞仕谛翱伟安延锋寅起谷稷胤涛弘'
      + '侠峰材爵楷尧炳乘蔓桀恒桓日坤龙锟天郁吉暄澄中斌杰祜权畅德'
  }

  get() {
    let length = [3, 2, 4, 5][parseInt(Math.random() * Math.random() * 3.1)]
    let name = []
    while (length--) {
      name.push(this.nameCode[parseInt(Math.random() * this.nameCode.length)])
    }
    return name.join('')
  }
}

export default NameGenerate

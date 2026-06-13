import {
  _decorator,
  Button,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  UITransform,
  Vec3,
} from 'cc';
import type { MergePreview } from '../../data/CardTypes';
import { CollectionManager } from '../../managers/CollectionManager';
import { DrawManager } from '../../managers/DrawManager';
import { InventoryManager } from '../../managers/InventoryManager';
import { MergeManager } from '../../managers/MergeManager';

const { ccclass } = _decorator;

interface HomePageInit {
  drawManager: DrawManager;
  mergeManager: MergeManager;
  collectionManager: CollectionManager;
  inventoryManager: InventoryManager;
}

@ccclass('HomePage')
export class HomePage extends Component {
  private drawManager?: DrawManager;
  private mergeManager?: MergeManager;
  private collectionManager?: CollectionManager;
  private inventoryManager?: InventoryManager;
  private statusLabel?: Label;
  private progressLabel?: Label;
  private drawsLabel?: Label;
  private routeLabel?: Label;

  init(deps: HomePageInit): void {
    this.drawManager = deps.drawManager;
    this.mergeManager = deps.mergeManager;
    this.collectionManager = deps.collectionManager;
    this.inventoryManager = deps.inventoryManager;
    this.render();
    this.refreshStats('今日已就绪，先完成一轮抽卡。');
  }

  private render(): void {
    this.node.removeAllChildren();
    this.createBackground();
    this.createTitle();
    this.createStats();
    this.createRoutePanel();
    this.createActions();
  }

  private createBackground(): void {
    const background = new Node('HomeBackground');
    background.setPosition(new Vec3(0, 0, -1));
    const transform = background.addComponent(UITransform);
    transform.setContentSize(760, 1200);

    const graphics = background.addComponent(Graphics);
    graphics.fillColor = new Color(18, 15, 13, 255);
    graphics.roundRect(-380, -600, 760, 1200, 0);
    graphics.fill();

    graphics.fillColor = new Color(69, 38, 25, 255);
    graphics.roundRect(-335, 385, 670, 145, 22);
    graphics.fill();

    graphics.fillColor = new Color(156, 99, 49, 110);
    graphics.roundRect(-320, 402, 640, 110, 18);
    graphics.fill();

    this.node.addChild(background);
  }

  private createTitle(): void {
    this.addLabel('国风炼金卡牌', 0, 455, 42, new Color(255, 238, 199, 255), 640);
    this.addLabel('抽卡 · 升星 · 合成 · 图鉴', 0, 405, 22, new Color(224, 177, 104, 255), 640);
  }

  private createStats(): void {
    const drawsCard = this.createCard('TodayDrawsCard', -175, 245, 300, 150);
    drawsCard.addChild(this.createTextNode('今日抽卡', 0, 42, 20, new Color(221, 186, 130, 255), 260));
    const drawsText = this.createTextNode('--', 0, -18, 38, new Color(255, 241, 210, 255), 260);
    drawsCard.addChild(drawsText);
    this.drawsLabel = drawsText.getComponent(Label) ?? undefined;

    const progressCard = this.createCard('ProgressCard', 175, 245, 300, 150);
    progressCard.addChild(this.createTextNode('图鉴进度', 0, 42, 20, new Color(221, 186, 130, 255), 260));
    const progressText = this.createTextNode('--', 0, -18, 38, new Color(255, 241, 210, 255), 260);
    progressCard.addChild(progressText);
    this.progressLabel = progressText.getComponent(Label) ?? undefined;
  }

  private createRoutePanel(): void {
    const routeCard = this.createCard('RouteCard', 0, 35, 650, 220);
    routeCard.addChild(this.createTextNode('推荐合成路线', 0, 70, 24, new Color(246, 211, 154, 255), 580));

    const routeText = this.createTextNode(
      '刘邦 + 纪信 -> 荥阳脱困\n荥阳脱困 + 鸿门宴 -> 楚汉相争',
      0,
      0,
      20,
      new Color(232, 213, 185, 255),
      580,
      30,
    );
    routeCard.addChild(routeText);
    this.routeLabel = routeText.getComponent(Label) ?? undefined;

    const statusText = this.createTextNode('', 0, -78, 18, new Color(177, 137, 88, 255), 580);
    routeCard.addChild(statusText);
    this.statusLabel = statusText.getComponent(Label) ?? undefined;
  }

  private createActions(): void {
    this.createButton('抽卡', -210, -180, () => this.handleDraw());
    this.createButton('合成预览', 0, -180, () => this.handleMergePreview());
    this.createButton('图鉴', 210, -180, () => this.handleCollection());
  }

  private handleDraw(): void {
    if (!this.drawManager) return;

    const result = this.drawManager.draw('weekly_qinhan', 10);
    this.refreshStats(`十连抽完成：${result.cards.map((card) => card.card_id).join(', ')}`);
    console.log('[国风炼金卡牌] 首页十连抽', result);
  }

  private handleMergePreview(): void {
    if (!this.mergeManager) return;

    const preview = this.mergeManager.preview('liubang_002', 'jixin_002');
    this.refreshStats(this.formatMergePreview(preview));
    console.log('[国风炼金卡牌] 首页合成预览', preview);
  }

  private handleCollection(): void {
    if (!this.collectionManager || !this.inventoryManager) return;

    const progress = this.collectionManager.getProgress();
    const inventoryCount = this.inventoryManager.getItems().length;
    this.refreshStats(`图鉴已解锁 ${progress.unlocked}/${progress.total}，库存种类 ${inventoryCount}`);
    console.log('[国风炼金卡牌] 首页图鉴进度', progress);
  }

  private refreshStats(status: string): void {
    const progress = this.collectionManager?.getProgress();
    if (this.drawsLabel && this.drawManager) {
      this.drawsLabel.string = `${this.drawManager.getRemainingDraws()}`;
    }

    if (this.progressLabel && progress) {
      this.progressLabel.string = `${progress.unlocked}/${progress.total}`;
    }

    if (this.statusLabel) {
      this.statusLabel.string = status;
    }
  }

  private formatMergePreview(preview: MergePreview): string {
    if (!preview.can_merge) {
      return '暂未找到这条历史合成关系。';
    }

    return `可合成：${preview.output}，成功率 ${Math.round((preview.success_rate ?? 0) * 100)}%`;
  }

  private createCard(name: string, x: number, y: number, width: number, height: number): Node {
    const card = new Node(name);
    card.setPosition(new Vec3(x, y, 0));
    const transform = card.addComponent(UITransform);
    transform.setContentSize(width, height);

    const graphics = card.addComponent(Graphics);
    graphics.fillColor = new Color(34, 27, 22, 238);
    graphics.roundRect(-width / 2, -height / 2, width, height, 18);
    graphics.fill();
    graphics.strokeColor = new Color(159, 104, 54, 180);
    graphics.lineWidth = 2;
    graphics.roundRect(-width / 2, -height / 2, width, height, 18);
    graphics.stroke();

    this.node.addChild(card);
    return card;
  }

  private createButton(labelText: string, x: number, y: number, onClick: () => void): Node {
    const buttonNode = this.createCard(`Button-${labelText}`, x, y, 180, 72);
    const button = buttonNode.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.96;
    buttonNode.on(Button.EventType.CLICK, onClick, this);

    buttonNode.addChild(this.createTextNode(labelText, 0, -2, 24, new Color(255, 231, 190, 255), 150));
    return buttonNode;
  }

  private addLabel(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: Color,
    width: number,
  ): Label {
    const node = this.createTextNode(text, x, y, fontSize, color, width);
    this.node.addChild(node);
    return node.getComponent(Label)!;
  }

  private createTextNode(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: Color,
    width: number,
    lineHeight?: number,
  ): Node {
    const node = new Node(`Text-${text.slice(0, 8)}`);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, Math.max(fontSize + 12, 48));

    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = lineHeight ?? fontSize + 8;
    label.color = color;

    return node;
  }
}

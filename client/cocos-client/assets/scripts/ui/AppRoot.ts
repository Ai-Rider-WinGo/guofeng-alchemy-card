import { _decorator, Canvas, Component, Node, UITransform, Vec3 } from 'cc';
import { ConfigLoader } from '../core/ConfigLoader';
import { CardManager } from '../managers/CardManager';
import { CollectionManager } from '../managers/CollectionManager';
import { DrawManager } from '../managers/DrawManager';
import { InventoryManager } from '../managers/InventoryManager';
import { MergeManager } from '../managers/MergeManager';
import { StarManager } from '../managers/StarManager';
import { HomePage } from './pages/HomePage';

const { ccclass } = _decorator;

@ccclass('AppRoot')
export class AppRoot extends Component {
  private cardManager?: CardManager;
  private inventoryManager?: InventoryManager;
  private drawManager?: DrawManager;
  private mergeManager?: MergeManager;
  private starManager?: StarManager;
  private collectionManager?: CollectionManager;

  async start(): Promise<void> {
    const config = await ConfigLoader.loadGameConfig();

    this.cardManager = new CardManager(config.cards);
    this.inventoryManager = new InventoryManager();
    this.drawManager = new DrawManager(
      config.drawPools,
      config.dailyLimits,
      this.cardManager,
      this.inventoryManager,
    );
    this.mergeManager = new MergeManager(config.mergeRules, this.cardManager, this.inventoryManager);
    this.starManager = new StarManager(this.inventoryManager);
    this.collectionManager = new CollectionManager(this.cardManager, this.inventoryManager);

    this.showHomePage();
  }

  private showHomePage(): void {
    if (
      !this.drawManager ||
      !this.mergeManager ||
      !this.inventoryManager ||
      !this.collectionManager
    ) {
      return;
    }

    const root = this.findCanvasNode();
    const homeNode = new Node('HomePage');
    const transform = homeNode.addComponent(UITransform);
    transform.setContentSize(760, 1200);
    homeNode.setPosition(new Vec3(0, 0, 0));

    const homePage = homeNode.addComponent(HomePage);
    root.addChild(homeNode);

    homePage.init({
      drawManager: this.drawManager,
      mergeManager: this.mergeManager,
      collectionManager: this.collectionManager,
      inventoryManager: this.inventoryManager,
    });

    console.log('[国风炼金卡牌] 首页已加载');
  }

  private findCanvasNode(): Node {
    let current: Node | null = this.node;

    while (current) {
      if (current.getComponent(Canvas)) {
        return current;
      }

      current = current.parent;
    }

    return this.node.parent ?? this.node;
  }
}

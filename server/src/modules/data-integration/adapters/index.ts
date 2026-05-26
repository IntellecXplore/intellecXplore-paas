import { registerAdapter } from './interface';
import { KingdeeGalaxyAdapter } from './kingdee-galaxy';
import { YonyouYonSuiteAdapter } from './yonyou-yonsuite';
import { GenericDBAdapter } from './generic-db';

// 注册所有适配器（副作用导入，模块加载时自动注册）
registerAdapter(KingdeeGalaxyAdapter);
registerAdapter(YonyouYonSuiteAdapter);
registerAdapter(GenericDBAdapter);

export { KingdeeGalaxyAdapter } from './kingdee-galaxy';
export { YonyouYonSuiteAdapter } from './yonyou-yonsuite';
export { GenericDBAdapter } from './generic-db';
export * from './interface';

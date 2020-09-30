import { NgModule } from '@angular/core';
import { CommonModule as NgCommonModule } from '@angular/common';
import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';
import { MapperModule } from '@flogo-web/lib-client/mapper';

import { BranchConfiguratorComponent } from './branch-configurator.component';

@NgModule({
  imports: [
    // module dependencies
    NgCommonModule,
    FlogoSharedModule,
    MapperModule,
  ],
  declarations: [BranchConfiguratorComponent],
  exports: [BranchConfiguratorComponent],
  providers: [],
})
export class BranchMapperModule {}

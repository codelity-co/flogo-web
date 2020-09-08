import {
  ContributionType,
  FlogoAppModel,
  SchemaSettingAttributeDescriptor,
  TypeConnection,
} from '@flogo-web/core';

export function transformConnectionTypeSettings(
  settings: FlogoAppModel.Settings,
  settingsSchema: SchemaSettingAttributeDescriptor[],
  transformRef: (contribType: ContributionType, ref: string) => string | undefined
) {
  const connectionSettings = settingsSchema?.filter(
    setting => setting.type === TypeConnection.Connection
  );
  if (connectionSettings && connectionSettings.length) {
    connectionSettings.forEach(connection => {
      const connectionSetting = settings[connection.name];
      if (connectionSetting) {
        connectionSetting.ref = transformRef(
          ContributionType.Connection,
          connectionSetting.ref
        );
      }
    });
  }
  return settings;
}

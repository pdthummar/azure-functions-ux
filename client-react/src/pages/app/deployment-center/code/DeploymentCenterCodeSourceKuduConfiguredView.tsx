import React, { useContext, useState } from 'react';
import DeploymentCenterData from '../DeploymentCenter.data';
import { DeploymentCenterContext } from '../DeploymentCenterContext';
import { useTranslation } from 'react-i18next';
import ReactiveFormControl from '../../../../components/form-controls/ReactiveFormControl';
import { ScmType } from '../../../../models/site/config';
import ConfirmDialog from '../../../../components/ConfirmDialog/ConfirmDialog';
import { Link, Icon } from 'office-ui-fabric-react';
import { disconnectLink } from '../DeploymentCenter.styles';
import { PortalContext } from '../../../../PortalContext';
import { DeploymentCenterFieldProps, DeploymentCenterCodeFormData } from '../DeploymentCenter.types';

const DeploymentCenterCodeSourceKuduConfiguredView: React.FC<DeploymentCenterFieldProps<DeploymentCenterCodeFormData>> = props => {
  const { formProps } = props;
  const { t } = useTranslation();
  const [isRefreshConfirmDialogVisible, setIsRefreshConfirmDialogVisible] = useState(false);

  const deploymentCenterData = new DeploymentCenterData();
  const deploymentCenterContext = useContext(DeploymentCenterContext);
  const portalContext = useContext(PortalContext);

  const showRefreshConfirmDialog = () => {
    setIsRefreshConfirmDialogVisible(true);
  };

  const hideRefreshConfirmDialog = () => {
    setIsRefreshConfirmDialogVisible(false);
  };

  const disconnect = async () => {
    const notificationId = portalContext.startNotification(t('disconnectingDeployment'), t('disconnectingDeployment'));

    const updatePathSiteConfigResponse = await deploymentCenterData.patchSiteConfig(deploymentCenterContext.resourceId, {
      properties: {
        scmType: 'None',
      },
    });

    if (updatePathSiteConfigResponse.metadata.success && deploymentCenterContext.siteConfig) {
      if (deploymentCenterContext.siteConfig.properties.scmType === ScmType.LocalGit) {
        formProps.resetForm();
        portalContext.stopNotification(notificationId, true, t('disconnectingDeploymentSuccess'));
        await deploymentCenterContext.refresh();
      } else {
        deleteSourceControls(notificationId);
      }
    } else {
      portalContext.stopNotification(notificationId, false, t('disconnectingDeploymentFail'));
    }
  };

  const deleteSourceControls = async (notificationId: string) => {
    //(note: t-kakan): DELETE call to `${resourceId}/sourcecontrols/web`
    const deleteSourceControlDetailsResponse = await deploymentCenterData.deleteSourceControlDetails(deploymentCenterContext.resourceId);

    if (deleteSourceControlDetailsResponse.metadata.success) {
      formProps.resetForm();
      portalContext.stopNotification(notificationId, true, t('disconnectingDeploymentSuccess'));
      await deploymentCenterContext.refresh();
    } else {
      portalContext.stopNotification(notificationId, false, t('disconnectingDeploymentFail'));
    }
  };

  const getSourceLocation = () => {
    const scmType = deploymentCenterContext.siteConfig && deploymentCenterContext.siteConfig.properties.scmType;
    switch (scmType) {
      case ScmType.BitbucketGit:
      case ScmType.BitbucketHg:
        return t('deploymentCenterCodeSettingsSourceBitbucket');
      case ScmType.ExternalGit:
        return t('deploymentCenterCodeSettingsSourceExternalGit');
      case ScmType.GitHub:
        return t('deploymentCenterCodeSettingsSourceGitHub');
      case ScmType.LocalGit:
        return t('deploymentCenterCodeSettingsSourceLocalGit');
      case ScmType.Dropbox:
        return t('deploymentCenterCodeSettingsSourceDropbox');
      case ScmType.OneDrive:
        return t('deploymentCenterCodeSettingsSourceOneDrive');
      case ScmType.Vso:
        return t('deploymentCenterCodeSettingsSourceAzureRepos');
      default:
        return '';
    }
  };

  return (
    <ReactiveFormControl id="deployment-center-github-user" label={t('deploymentCenterSettingsSourceLabel')}>
      <div>
        {getSourceLocation()}
        <Link
          key="deployment-center-disconnect-link"
          onClick={showRefreshConfirmDialog}
          className={disconnectLink}
          aria-label={t('disconnect')}>
          <Icon iconName={'PlugDisconnected'} />
          {` ${t('disconnect')}`}
        </Link>
        <ConfirmDialog
          primaryActionButton={{
            title: t('ok'),
            onClick: disconnect,
          }}
          defaultActionButton={{
            title: t('cancel'),
            onClick: hideRefreshConfirmDialog,
          }}
          title={t('kuduDisconnectConfirmationTitle')}
          content={t('disconnectConfirm')}
          hidden={!isRefreshConfirmDialogVisible}
          onDismiss={hideRefreshConfirmDialog}
        />
      </div>
    </ReactiveFormControl>
  );
};

export default DeploymentCenterCodeSourceKuduConfiguredView;

import React from 'react';
import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';
import capitalize from 'lodash/capitalize';
import moment from 'moment';

import {Client} from 'app/api';
import Button from 'app/components/button';
import ButtonBar from 'app/components/buttonBar';
import Card from 'app/components/card';
import {HeaderTitle} from 'app/components/charts/styles';
import LoadingIndicator from 'app/components/loadingIndicator';
import PageHeading from 'app/components/pageHeading';
import {Panel, PanelBody} from 'app/components/panels';
import {t, tct} from 'app/locale';
import {PageContent, PageHeader} from 'app/styles/organization';
import overflowEllipsis from 'app/styles/overflowEllipsis';
import space from 'app/styles/space';
import {Organization} from 'app/types';

import Chart from './chart';
import {formatUsageWithUnits} from './fromGetsentry';
import {DataCategory, OrganizationUsageStats, ProjectUsageStats} from './types';
import withOrgStats from './withOrgStats';

type Props = {
  api: Client;
  organization: Organization;

  orgStats?: OrganizationUsageStats;
  orgStatsLoading: boolean;
  orgStatsError?: Error;

  projectStats?: ProjectUsageStats[];
  projectStatsLoading: boolean;
  projectStatsError?: Error;
} & RouteComponentProps<{orgId: string}, {}>;

type State = {
  dataCategory: DataCategory;
};

// TODO: Move over from getsentry

class OrganizationStats extends React.Component<Props, State> {
  state: State = {
    dataCategory: DataCategory.ERRORS,
  };

  setSelectedDataCategory = (dataCategory: DataCategory) => {
    this.setState({dataCategory});
  };

  get selectedDataCategory() {
    return capitalize(this.state.dataCategory);
  }

  get formattedOrgStats(): {
    stats: any[];
    total: string;
    accepted: string;
    rateLimited: string;
    filtered: string;
  } {
    const {orgStats} = this.props;
    const {dataCategory} = this.state;

    if (!orgStats) {
      return {
        stats: [],
        total: '—',
        accepted: '—',
        rateLimited: '—',
        filtered: '—',
      };
    }

    const rawStats =
      dataCategory === DataCategory.ERRORS
        ? orgStats?.statsErrors
        : dataCategory === DataCategory.TRANSACTIONS
        ? orgStats?.statsTransactions
        : orgStats?.statsAttachments;

    const stats = rawStats.reduce(
      (acc, m) => {
        acc.stats.push({
          date: moment.unix((m as any).time).format('MMM D'),
          total: m.accepted.times_seen + m.filtered.times_seen, // TODO
          accepted: m.accepted.times_seen,
          filtered: m.filtered.times_seen,
          dropped: {},
        });

        acc.accepted += m.accepted.times_seen;
        acc.filtered += m.filtered.times_seen;
        // TODO: acc.rateLimited += m..times_seen;

        return acc;
      },
      {
        stats: [] as any[], // TODO/(ts)
        total: 0,
        accepted: 0,
        rateLimited: 0,
        filtered: 0,
      }
    );

    const formatOptions = {
      isAbbreviated: dataCategory !== DataCategory.ATTACHMENTS,
      useUnitScaling: dataCategory === DataCategory.ATTACHMENTS,
    };

    return {
      ...stats,
      total: formatUsageWithUnits(stats.total, dataCategory, formatOptions),
      accepted: formatUsageWithUnits(stats.accepted, dataCategory, formatOptions),
      rateLimited: formatUsageWithUnits(stats.rateLimited, dataCategory, formatOptions),
      filtered: formatUsageWithUnits(stats.filtered, dataCategory, formatOptions),
    };
  }

  renderCards() {
    const {total, accepted, rateLimited, filtered} = this.formattedOrgStats;

    const cardData = [
      {
        title: tct('Total [dataCategory]', {dataCategory: this.selectedDataCategory}),
        value: total,
      },
      {
        title: t('Accepted'),
        value: accepted,
      },
      {
        title: t('Rate-limited'),
        value: rateLimited,
      },
      {
        title: t('Filtered'),
        value: filtered,
      },
    ];

    return (
      <CardWrapper>
        {cardData.map((c, i) => (
          <StyledCard key={i}>
            <HeaderTitle>
              <OverflowEllipsis>{c.title}</OverflowEllipsis>
            </HeaderTitle>
            <CardContent>
              <OverflowEllipsis>{c.value}</OverflowEllipsis>
            </CardContent>
          </StyledCard>
        ))}
      </CardWrapper>
    );
  }

  renderChart() {
    if (this.props.orgStatsError) {
      return (
        <Panel>
          <PanelBody>Error. Check console.</PanelBody>
        </Panel>
      );
    }

    if (this.props.orgStatsLoading || !this.props.orgStats) {
      return (
        <Panel>
          <PanelBody>
            <LoadingIndicator />
          </PanelBody>
        </Panel>
      );
    }

    // const {orgStats} = this.props;
    const {dataCategory} = this.state;
    const {stats} = this.formattedOrgStats;

    const today = moment().format('YYYY-MM-DD');
    const start = moment().subtract(30, 'days').format('YYYY-MM-DD');

    return (
      <Panel>
        <Chart
          hasTransactions
          hasAttachments={false}
          usagePeriodStart={start}
          usagePeriodEnd={today}
          usagePeriodToday={today}
          statsAttachments={stats}
          statsErrors={stats}
          statsTransactions={stats}
        />

        <ButtonBar active={dataCategory} merged>
          {Object.keys(DataCategory).map(k => {
            return (
              <Button
                key={DataCategory[k]}
                barId={DataCategory[k]}
                onClick={() => this.setSelectedDataCategory(DataCategory[k])}
              >
                {capitalize(DataCategory[k])}
              </Button>
            );
          })}
        </ButtonBar>
      </Panel>
    );
  }

  render() {
    return (
      <PageContent>
        <PageHeader>
          <PageHeading>
            {tct('Organization Usage Stats for [dataCategory]', {
              dataCategory: this.selectedDataCategory,
            })}
          </PageHeading>
        </PageHeader>

        {this.renderCards()}
        {this.renderChart()}
      </PageContent>
    );
  }
}

export default withOrgStats(OrganizationStats);

const CardWrapper = styled('div')`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  grid-auto-rows: 1fr;
  grid-gap: ${space(2)};
  margin-bottom: ${space(3)};

  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    grid-auto-flow: row;
  }
`;

const StyledCard = styled(Card)`
  align-items: flex-start;
  min-height: 95px;
  padding: ${space(2)} ${space(3)};
  color: ${p => p.theme.textColor};
`;
const CardContent = styled('div')`
  margin-top: ${space(1)};
  font-size: 32px;
`;
const OverflowEllipsis = styled('div')`
  ${overflowEllipsis};
`;

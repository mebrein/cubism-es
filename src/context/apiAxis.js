import { timeFormat } from 'd3-time-format';
import { axisBottom } from 'd3-axis';
import { select } from 'd3-selection';

const formatSeconds = timeFormat('%I:%M:%S %p');
const formatMinutes = timeFormat('%I:%M %p');
const formatDays = timeFormat('%B %d');
const formatDefault = context =>
  context.step() < 6e4
    ? formatSeconds
    : context.step() < 864e5
      ? formatMinutes
      : formatDays;

const apiRemove = axisState => ({
  remove: selection => {
    const { context } = axisState;
    selection
      .selectAll('svg')
      .each(d => {
        context.on('change.axis-' + d.id, null);
        context.on('focus.axis-' + d.id, null);
      })
      .remove();
  },
});

const apiFocusFormat = axisState => ({
  focusFormat: (_ = null) => {
    if (_ === null)
      return axisState.format === formatDefault(axisState.context) ? null : _;
    axisState.format = _ == null ? formatDefault(context) : _;
    return axisState;
  },
});

const runAxis = (state, selection) => {
  const { _axis, scale, format, id, context } = state;

  let tick;

  const g = selection
    .append('svg')
    .datum({ id })
    .attr('width', context.size())
    .attr('height', Math.max(28, -_axis.tickSize()))
    .append('g')
    .attr('transform', 'translate(0,' + 4 + ')')
    .call(_axis);

  context.on('change.axis-' + id, () => {
    g.call(_axis);
    if (!tick)
      tick = select(
        g.node().appendChild(
          g
            .selectAll('text')
            .node()
            .cloneNode(true)
        )
      )
        .style('display', 'none')
        .text(null);
  });

  context.on('focus.axis-' + id, i => {
    if (tick) {
      if (i == null) {
        tick.style('display', 'none');
        g.selectAll('text').style('fill-opacity', null);
      } else {
        tick
          .style('display', null)
          .attr('x', i)
          .text(format(scale.invert(i)));
        const dx = tick.node().getComputedTextLength() + 6;
        g
          .selectAll('text')
          .style('fill-opacity', d => (Math.abs(scale(d) - i) < dx ? 0 : 1));
      }
    }
  });
};

const apiAxis = context => ({
  axis: selection => {
    const axisState = {
      context,
      scale: context.scale,
      _axis: axisBottom().scale(context.scale),
      format: formatDefault(context),
      id: ++context._id,
    };

    runAxis(axisState, selection);

    return Object.assign(
      axisState,
      apiRemove(axisState),
      apiFocusFormat(axisState)
    );
  },
});

export default apiAxis;
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3BarChartProps {
  entityA: { name: string; value: number };
  entityB: { name: string; value: number };
  stat: { name: string; unit: string };
  isCorrect: boolean;
}

export function D3BarChart({ entityA, entityB, stat, isCorrect }: D3BarChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    
    // Clear previous if re-rendered
    d3.select(wrapperRef.current).selectAll('*').remove();

    const data = [
      { id: 'a', name: entityA.name, value: entityA.value },
      { id: 'b', name: entityB.name, value: entityB.value }
    ];
    
    const width = wrapperRef.current.clientWidth || 600;
    const height = 160;
    const barHeight = 40;
    const gap = 30;
    const maxValue = d3.max(data, d => d.value) || 1;

    const svg = d3.select(wrapperRef.current)
      .append('svg')
      .attr('class', 'w-full overflow-visible')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const xScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, width]);

    // Draw background tracks
    svg.selectAll('.track')
      .data(data)
      .join('rect')
      .attr('class', 'track')
      .attr('x', 0)
      .attr('y', (d, i) => i * (barHeight + gap) + 20)
      .attr('width', width)
      .attr('height', barHeight)
      .attr('rx', 8)
      .attr('fill', 'rgba(0,0,0,0.05)');

    // Draw animated bars
    svg.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', (d, i) => i * (barHeight + gap) + 20)
      .attr('width', 0)
      .attr('height', barHeight)
      .attr('rx', 8)
      .attr('fill', d => {
        return d.value === maxValue ? 'var(--color-brand-correct)' : '#000000';
      })
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .transition()
      .duration(1200)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr('width', d => Math.max(xScale(d.value), 4));

    // Entity Names (above bars)
    svg.selectAll('.name-label')
      .data(data)
      .join('text')
      .attr('class', 'name-label')
      .attr('x', 0)
      .attr('y', (d, i) => i * (barHeight + gap) + 12)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', 'var(--color-brand-text-secondary)')
      .text(d => d.name);

    // Animated values (inside or end of bars)
    const valueLabels = svg.selectAll('.value-label')
      .data(data)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', 0)
      .attr('y', (d, i) => i * (barHeight + gap) + 20 + barHeight / 2)
      .attr('dy', '0.35em')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '14px')
      .attr('font-weight', '700')
      .attr('fill', '#fff'); // will update color during tween if needed

    valueLabels.transition()
      .duration(1200)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .tween('text', function(d) {
        const i = d3.interpolateRound(0, d.value);
        const node = this;
        return function(t) {
          const currentVal = i(t);
          const barWidth = Math.max(xScale(currentVal), 4);
          const textStr = `${currentVal.toLocaleString()} ${stat.unit}`;
          
          // Estimate text width roughly
          const estTextWidth = textStr.length * 8.5;
          
          if (barWidth > estTextWidth + 20) {
            // Fits inside
            d3.select(node)
              .attr('x', barWidth - 10)
              .attr('text-anchor', 'end')
              .attr('fill', '#fff')
              .text(textStr);
          } else {
            // Outside
            d3.select(node)
              .attr('x', barWidth + 10)
              .attr('text-anchor', 'start')
              .attr('fill', 'var(--color-brand-text-primary)')
              .text(textStr);
          }
        };
      });

    return () => {
      if (wrapperRef.current) {
        d3.select(wrapperRef.current).selectAll('*').interrupt();
      }
    };
  }, [entityA.value, entityB.value, entityA.name, entityB.name, stat.unit]);

  return (
    <div className="w-full" ref={wrapperRef}>
    </div>
  );
}

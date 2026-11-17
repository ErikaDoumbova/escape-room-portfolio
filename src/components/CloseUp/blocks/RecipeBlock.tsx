import { Clock, Printer, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';

import type { Block } from '../../../content/schema.ts';
import { useT } from '../../../content/useT.ts';
import styles from './blocks.module.css';

type Of<T extends Block['type']> = Extract<Block, { type: T }>;

/** The recipe card (§5.4). Ticking ingredients is just for fun; it isn't saved. */
export function RecipeBlock({ block, title }: { block: Of<'recipe'>; title: string }) {
  const { t, ui } = useT();
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  // Print only the recipe: render a clean copy outside the app, then print (§5.4).
  const print = () => {
    flushSync(() => setPrinting(true));
    window.print();
  };

  const content = (forPrint: boolean) => (
    <>
      {forPrint && <h1 className={styles.printTitle}>{title}</h1>}
      <ul className={styles.chips}>
        <li className={styles.chip}>
          <Users size={16} strokeWidth={1.75} aria-hidden="true" />
          {ui('servings', { n: block.servings })}
        </li>
        <li className={styles.chip}>
          <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
          {t(block.time)}
        </li>
      </ul>
      <h3 className={styles.recipeHeading}>{ui('ingredients')}</h3>
      <ul className={styles.ingredients}>
        {block.ingredients.map((line, i) => (
          <li key={i}>
            {forPrint ? (
              t(line)
            ) : (
              <label className={styles.ingredient}>
                <input type="checkbox" />
                <span>{t(line)}</span>
              </label>
            )}
          </li>
        ))}
      </ul>
      <h3 className={styles.recipeHeading}>{ui('steps')}</h3>
      <ol className={styles.steps}>
        {block.steps.map((step, i) => (
          <li key={i}>{t(step)}</li>
        ))}
      </ol>
      {block.tip && (
        <p className={styles.tip}>
          <strong>{ui('tip')}:</strong> {t(block.tip)}
        </p>
      )}
    </>
  );

  return (
    <section className={styles.recipe} data-testid="recipe">
      {content(false)}
      <button
        type="button"
        className={`${styles.pillButton} ${styles.printButton}`}
        onClick={print}
      >
        <Printer size={18} strokeWidth={1.75} aria-hidden="true" />
        {ui('printRecipe')}
      </button>
      {printing && createPortal(<div className="print-root">{content(true)}</div>, document.body)}
    </section>
  );
}

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Faq {
  question: string;
  answer: string;
}

export default function FaqAccordion({ faqs, headingLevel = 2 }: { faqs: Faq[]; headingLevel?: 2 | 3 | 4 | 5 | 6 }) {
  const Heading = `h${headingLevel}` as keyof JSX.IntrinsicElements;
  return (
    <section className="max-w-3xl mx-auto py-12 px-4">
      <Heading className="text-2xl font-bold mb-6 text-center">FREQUENTLY ASKED QUESTIONS (FAQs)</Heading>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-semibold text-base py-4">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
